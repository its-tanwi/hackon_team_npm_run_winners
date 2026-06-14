"""Subagent 2: Catalog Matcher.

Pipeline (mirrors how production e-commerce search works):

  for each identified need:
    1. Lexical retrieval (BM25) — top-K candidates by keyword score
    2. Semantic retrieval (Gemini embeddings) — top-K candidates by vector similarity
    3. Merge + dedupe candidates
  4. LLM rerank: send all candidates + needs to Gemini, ask it to pick the best
     match per need (or mark unmatched), assign confidence, suggest quantity,
     and explain.

This keeps the LLM prompt small (only candidates, never the full catalog) so it
scales to thousands of products and stays cheap.
"""

from __future__ import annotations

import sys
from collections import OrderedDict
from functools import lru_cache
from typing import Dict, Iterable, List

from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from app.catalog import lexical, semantic
from app.catalog.source import get_catalog
from app.config import GEMINI_MODEL
from app.models import (
    CatalogProduct,
    IdentifiedNeed,
    MatchResult,
    NeedsResult,
)

PER_RETRIEVER_TOP_K = 3


SYSTEM_PROMPT = """You are the Catalog Matcher for the Amazon Now quick-commerce agent.

You will be given:
  - A list of NEEDS the user has (each with an item name, category, and reason).
  - A short shortlist of CANDIDATE products from the catalog (already pre-filtered
    by lexical + semantic retrievers). Each candidate has an id, title, brief
    description, and price.

For EACH need, decide which single candidate (if any) best fulfills it.

Rules:
  - Use ONLY product ids that appear in the candidate list. Never invent ids.
  - If no candidate is a reasonable fit for a need, do NOT force a match;
    add the need's item string to ``unmatched_needs`` instead.
  - Confidence labels:
      high   = obvious fit (e.g. need "lemon", product "Lemon")
      medium = related fit (e.g. need "warm soup", product "Soft Drinks" -- a beverage)
      low    = weak / loose fit (avoid these unless catalog is sparse)
  - Suggest a quantity of 1 unless the need clearly warrants more.
  - Provide a 1-sentence rationale for each match.
  - The same product MAY be used for at most one match across all needs.
"""

USER_PROMPT_TEMPLATE = """NEEDS:
{needs_block}

CANDIDATES (use only these ids):
{candidates_block}

Pick the best matches per the system rules and return them as structured output."""


def _gather_candidates(needs: Iterable[IdentifiedNeed]) -> List[CatalogProduct]:
    """Run both retrievers for every need and union the candidates (dedup by id)."""
    needs_list = list(needs)
    seen: "OrderedDict[int, CatalogProduct]" = OrderedDict()
    for i, need in enumerate(needs_list, 1):
        query = f"{need.item}. {need.reason}"
        print(
            f"  [retrieve {i}/{len(needs_list)}] '{need.item}' "
            f"(BM25 + embeddings)...",
            flush=True,
        )
        for product in lexical.search(query, top_k=PER_RETRIEVER_TOP_K):
            seen.setdefault(product.id, product)
        for product in semantic.search(query, top_k=PER_RETRIEVER_TOP_K):
            seen.setdefault(product.id, product)
    print(f"  -> {len(seen)} unique candidate(s) after dedupe", flush=True)
    return list(seen.values())


def _format_needs(needs: Iterable[IdentifiedNeed]) -> str:
    return "\n".join(
        f"- {n.item} (category: {n.category}) — {n.reason}" for n in needs
    )


def _format_candidates(candidates: Iterable[CatalogProduct]) -> str:
    lines = []
    for p in candidates:
        desc = (p.description or "").replace("\n", " ").strip()
        if len(desc) > 140:
            desc = desc[:137] + "..."
        lines.append(f"- id={p.id} | {p.title} | ${p.price:.2f} | {desc}")
    return "\n".join(lines) if lines else "(no candidates)"


@lru_cache(maxsize=1)
def _build_chain():
    # 60s ceiling so a stuck Gemini call surfaces instead of hanging forever.
    llm = ChatGoogleGenerativeAI(model=GEMINI_MODEL, temperature=0.1, timeout=60)
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            ("user", USER_PROMPT_TEMPLATE),
        ]
    )
    return prompt | llm.with_structured_output(MatchResult)


def _validate_matches(
    result: MatchResult,
    candidates: List[CatalogProduct],
    needs: List[IdentifiedNeed],
) -> MatchResult:
    """Drop matches whose product_id is hallucinated; ensure title is fresh."""
    valid_ids: Dict[int, CatalogProduct] = {p.id: p for p in candidates}
    cleaned = []
    used_ids: set[int] = set()
    for match in result.matches:
        if match.product_id not in valid_ids:
            continue
        if match.product_id in used_ids:
            continue
        used_ids.add(match.product_id)
        match.product_title = valid_ids[match.product_id].title
        cleaned.append(match)

    matched_need_items = {m.need_item for m in cleaned}
    unmatched = list(result.unmatched_needs)
    for need in needs:
        if need.item not in matched_need_items and need.item not in unmatched:
            unmatched.append(need.item)

    return MatchResult(matches=cleaned, unmatched_needs=unmatched)


def match_catalog(needs: NeedsResult) -> MatchResult:
    """Subagent 2's public entrypoint: needs in, matches out."""
    if not needs.needs:
        return MatchResult(matches=[], unmatched_needs=[])

    candidates = _gather_candidates(needs.needs)
    if not candidates:
        return MatchResult(
            matches=[],
            unmatched_needs=[n.item for n in needs.needs],
        )

    chain = _build_chain()
    print(
        f"  [rerank] Asking Gemini to pick best of {len(candidates)} "
        f"candidates for {len(needs.needs)} need(s)...",
        flush=True,
    )
    raw_result = chain.invoke(
        {
            "needs_block": _format_needs(needs.needs),
            "candidates_block": _format_candidates(candidates),
        }
    )
    print("  [rerank] done.", flush=True)
    if not isinstance(raw_result, MatchResult):
        raw_result = MatchResult.model_validate(raw_result)

    return _validate_matches(raw_result, candidates, needs.needs)


def _pretty_print(result: MatchResult) -> None:
    print(f"\nMatched {len(result.matches)} item(s):")
    for i, m in enumerate(result.matches, 1):
        print(
            f"  {i}. need='{m.need_item}' -> #{m.product_id} {m.product_title} "
            f"x{m.quantity}  [{m.confidence}]"
        )
        print(f"       {m.rationale}")
    if result.unmatched_needs:
        print(f"\nUnmatched ({len(result.unmatched_needs)}):")
        for item in result.unmatched_needs:
            print(f"  - {item}")
    print()


if __name__ == "__main__":
    from app.agents.needs_identifier import identify_needs

    prompt = " ".join(sys.argv[1:]) or "I am sick, having fever"
    print(f"Prompt: {prompt}")
    print("Running Subagent 1 (Needs Identifier)...")
    needs = identify_needs(prompt)
    print(f"  -> {len(needs.needs)} needs identified")
    print("Running Subagent 2 (Catalog Matcher)...")
    print(f"  -> Catalog has {len(get_catalog())} products")
    matches = match_catalog(needs)
    _pretty_print(matches)
