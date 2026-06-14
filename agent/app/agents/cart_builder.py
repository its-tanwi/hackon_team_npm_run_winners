"""Subagent 3: Cart Builder.

Takes the upstream ``NeedsResult`` + ``MatchResult`` and asks Gemini to
curate the *final* cart — adjust quantities, drop low-confidence picks,
generate a friendly chat-style message, and propose alternatives for
needs the catalog couldn't satisfy.

The LLM only emits decisions (product ids + quantities + rationales);
we hydrate full product details (price, image, description) and compute
totals deterministically afterwards. This means the LLM can never
hallucinate a price or invent a non-existent product.
"""

from __future__ import annotations

import sys
from functools import lru_cache
from typing import Dict, List

from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from app.catalog.source import get_catalog
from app.config import GEMINI_MODEL
from app.models import (
    CartCuratorDraft,
    CartLineItem,
    CartPlan,
    CatalogProduct,
    IdentifiedNeed,
    MatchResult,
    MatchedItem,
    NeedsResult,
)


SYSTEM_PROMPT = """You are the Cart Builder for the Amazon Now quick-commerce agent.

You are given:
  - The user's original prompt (e.g. "I am sick, having fever").
  - The list of NEEDS Subagent 1 identified.
  - The MATCHES Subagent 2 found in the catalog (each with a product id,
    title, price, suggested quantity, and confidence label).
  - The list of UNMATCHED needs (items the catalog does not stock).

Your job is to produce the FINAL cart for the user. You decide:
  1. Which matches stay (drop a match if its confidence is low and it doesn't
     materially help the user, e.g. confidence=low and the situation doesn't
     require a stretch).
  2. The right quantity for each kept match (1-10), considering the situation.
     Examples of good quantity choices:
        - sick + fever: 1 honey jar, 1 box of tissues, 2 bottles of water
        - movie night: 2 packs of chips, 4 cans of soft drink, 1 ice cream
     Don't multiply quantities arbitrarily; pick what a reasonable shopper
     would actually want for a single occasion.
  3. A friendly 1-2 sentence chat-style MESSAGE the UI can show. Address the
     user directly ("I've added..."). Tone: warm, concise, helpful. No emojis.
  4. SUGGESTIONS for unmatched needs. One short bullet per unmatched item,
     using a colon to separate the item from the suggestion:
     "<item>: <where to find it / what to substitute>". Keep it practical
     ("paracetamol: try our pharmacy partner"; "ginger: try a fresh produce
     store"). If the catalog has no decent substitute, say so.

Style rules (important):
  - Do NOT use em dashes (—) or en dashes (–) in your message or suggestions.
    Use periods, commas, or colons instead.
  - Do NOT use emojis.
  - Keep punctuation simple and consistent.

Hard rules:
  - You may ONLY use product ids that appear in the matches list. Never invent ids.
  - Each product appears in the cart at most once (sum quantities if needed).
  - Keep at least 1 item if there is at least one match with confidence >= medium.
  - If every match is low confidence and a stretch, you may return an empty cart
    with a message explaining what to try instead.
"""

USER_PROMPT_TEMPLATE = """USER PROMPT: {user_prompt}

NEEDS:
{needs_block}

MATCHES (use only these product ids):
{matches_block}

UNMATCHED NEEDS:
{unmatched_block}

Produce the final curated cart per the system rules.
"""


def _format_needs(needs: List[IdentifiedNeed]) -> str:
    if not needs:
        return "(none)"
    return "\n".join(
        f"- {n.item} (category: {n.category}) — {n.reason}" for n in needs
    )


def _format_matches(
    matches: List[MatchedItem], catalog: Dict[int, CatalogProduct]
) -> str:
    if not matches:
        return "(no matches)"
    lines = []
    for m in matches:
        product = catalog.get(m.product_id)
        price = f"${product.price:.2f}" if product else "?"
        lines.append(
            f"- id={m.product_id} | {m.product_title} | {price} | "
            f"need='{m.need_item}' | suggested_qty={m.quantity} | "
            f"confidence={m.confidence}"
        )
    return "\n".join(lines)


def _format_unmatched(unmatched: List[str]) -> str:
    if not unmatched:
        return "(none)"
    return "\n".join(f"- {item}" for item in unmatched)


@lru_cache(maxsize=1)
def _build_chain():
    llm = ChatGoogleGenerativeAI(model=GEMINI_MODEL, temperature=0.3, timeout=60)
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            ("user", USER_PROMPT_TEMPLATE),
        ]
    )
    return prompt | llm.with_structured_output(CartCuratorDraft)


def _hydrate_cart(
    draft: CartCuratorDraft,
    valid_ids: Dict[int, CatalogProduct],
    needs_by_item: Dict[str, IdentifiedNeed],
    matches_by_id: Dict[int, MatchedItem],
) -> CartPlan:
    """Turn an LLM draft into a fully-typed ``CartPlan`` with prices + images."""
    items: List[CartLineItem] = []
    seen_ids: set[int] = set()

    for pick in draft.items:
        product = valid_ids.get(pick.product_id)
        if product is None:
            continue
        if pick.product_id in seen_ids:
            for existing in items:
                if existing.id == pick.product_id:
                    existing.quantity = min(existing.quantity + pick.quantity, 10)
                    break
            continue
        seen_ids.add(pick.product_id)

        match = matches_by_id.get(pick.product_id)
        category = "groceries"
        if match is not None:
            need = needs_by_item.get(match.need_item)
            if need is not None:
                category = need.category

        items.append(
            CartLineItem(
                id=product.id,
                title=product.title,
                price=float(product.price),
                description=product.description,
                category=category,
                image=product.thumbnail,
                quantity=pick.quantity,
                rationale=pick.rationale,
            )
        )

    total = round(sum(item.price * item.quantity for item in items), 2)
    return CartPlan(
        items=items,
        suggestions=list(draft.suggestions),
        message=draft.message,
        total_estimated_cost_usd=total,
    )


def build_cart(
    user_prompt: str,
    needs: NeedsResult,
    matches: MatchResult,
) -> CartPlan:
    """Subagent 3's public entrypoint: build the final cart from upstream state."""
    catalog_by_id: Dict[int, CatalogProduct] = {p.id: p for p in get_catalog()}
    valid_ids: Dict[int, CatalogProduct] = {
        m.product_id: catalog_by_id[m.product_id]
        for m in matches.matches
        if m.product_id in catalog_by_id
    }

    if not valid_ids:
        message = (
            "Sorry — I couldn't find anything in our catalog that fits your request. "
            "Try rephrasing what you need."
        )
        suggestions = [f"{item} — try a different store" for item in matches.unmatched_needs]
        return CartPlan(items=[], suggestions=suggestions, message=message)

    needs_by_item = {n.item: n for n in needs.needs}
    matches_by_id = {m.product_id: m for m in matches.matches}

    chain = _build_chain()
    draft = chain.invoke(
        {
            "user_prompt": user_prompt,
            "needs_block": _format_needs(needs.needs),
            "matches_block": _format_matches(matches.matches, catalog_by_id),
            "unmatched_block": _format_unmatched(matches.unmatched_needs),
        }
    )
    if not isinstance(draft, CartCuratorDraft):
        draft = CartCuratorDraft.model_validate(draft)

    return _hydrate_cart(draft, valid_ids, needs_by_item, matches_by_id)


def _pretty_print(plan: CartPlan) -> None:
    print(f"\nMessage: {plan.message}")
    print(f"\nCart ({len(plan.items)} item(s), ~${plan.total_estimated_cost_usd:.2f}):")
    for i, item in enumerate(plan.items, 1):
        print(
            f"  {i}. #{item.id} {item.title} x{item.quantity}  "
            f"@ ${item.price:.2f}  [{item.category}]"
        )
        print(f"       {item.rationale}")
    if plan.suggestions:
        print(f"\nSuggestions:")
        for s in plan.suggestions:
            print(f"  - {s}")
    print()


if __name__ == "__main__":
    from app.agents.catalog_matcher import match_catalog
    from app.agents.needs_identifier import identify_needs

    prompt = " ".join(sys.argv[1:]) or "I am sick, having fever"
    print(f"Prompt: {prompt}")
    print("Running Subagent 1 (Needs Identifier)...")
    needs = identify_needs(prompt)
    print(f"  -> {len(needs.needs)} needs")
    print("Running Subagent 2 (Catalog Matcher)...")
    matches = match_catalog(needs)
    print(f"  -> {len(matches.matches)} matched, {len(matches.unmatched_needs)} unmatched")
    print("Running Subagent 3 (Cart Builder)...")
    plan = build_cart(prompt, needs, matches)
    _pretty_print(plan)
