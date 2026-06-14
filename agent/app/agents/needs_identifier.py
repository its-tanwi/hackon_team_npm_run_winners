"""Subagent 1: Needs Identifier.

Translates a user's free-text prompt (e.g. "I am sick, having fever")
into a structured list of items they likely need.

Powered by Google Gemini via LangChain's structured output binding.
"""

from __future__ import annotations

import sys
from functools import lru_cache

from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from app.models import NeedsResult

load_dotenv()

MODEL_NAME = "gemini-3.5-flash"

SYSTEM_PROMPT = """You are a helpful shopping assistant for an Indian quick-commerce app called Amazon Now.

Given a user's free-text request — symptoms, mood, situation, plan, or vague need —
identify the items they should have on hand to feel better or accomplish their goal.

Guidelines:
- Suggest between 4 and 8 relevant items. Quality over quantity.
- Prefer items commonly stocked in Indian quick-commerce groceries:
  fresh produce, pantry staples, household goods, OTC medicine, beverages, snacks.
- Use lowercase generic names ("paracetamol", "lemon", "honey", "tissue", "ORS"), NOT brand names.
- Categorize each item using exactly one of:
    medicine, produce, pantry, dairy, beverage, household, snacks, other
- Each item must include a 1-sentence reason explaining why it's relevant.
- Provide a brief overall rationale summarizing the situation in 1-2 sentences.
"""

USER_PROMPT_TEMPLATE = """User's request: {user_prompt}

Identify the items they need."""


@lru_cache(maxsize=1)
def _build_chain():
    """Build the LangChain pipeline once and cache it.

    Uses ``with_structured_output`` so we get a typed ``NeedsResult`` back
    instead of having to parse free-text JSON.
    """
    llm = ChatGoogleGenerativeAI(model=MODEL_NAME, temperature=0.3)
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            ("user", USER_PROMPT_TEMPLATE),
        ]
    )
    return prompt | llm.with_structured_output(NeedsResult)


def identify_needs(user_prompt: str) -> NeedsResult:
    """Run the Needs Identifier subagent on a user prompt.

    Args:
        user_prompt: Raw text the user typed, e.g. "I am sick, having fever".

    Returns:
        A ``NeedsResult`` with a list of items and a short rationale.
    """
    chain = _build_chain()
    result = chain.invoke({"user_prompt": user_prompt})
    if not isinstance(result, NeedsResult):
        # ``with_structured_output`` may return a dict in some configurations; coerce it.
        result = NeedsResult.model_validate(result)
    return result


def _pretty_print(result: NeedsResult) -> None:
    print(f"\nRationale: {result.rationale}\n")
    print(f"Identified {len(result.needs)} need(s):")
    for i, need in enumerate(result.needs, 1):
        print(f"  {i}. [{need.category:>10}] {need.item} — {need.reason}")
    print()


if __name__ == "__main__":
    prompt = " ".join(sys.argv[1:]) or "I am sick, having fever"
    print(f"Prompt: {prompt}")
    print("Calling Gemini ...")
    needs = identify_needs(prompt)
    _pretty_print(needs)
