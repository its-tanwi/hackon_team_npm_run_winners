"""LangGraph state graph wiring all subagents together.

The graph has three nodes that run sequentially:
  1. ``identify_needs``  — Subagent 1 (Needs Identifier)
  2. ``match_catalog``   — Subagent 2 (Catalog Matcher)
  3. ``build_cart``      — Subagent 3 (Cart Builder)
"""

from __future__ import annotations

import sys
from typing import Optional, TypedDict

from langgraph.graph import END, START, StateGraph

from app.agents.cart_builder import build_cart
from app.agents.catalog_matcher import match_catalog
from app.agents.needs_identifier import identify_needs
from app.models import CartPlan, MatchResult, NeedsResult


class CartAgentState(TypedDict, total=False):
    """State that flows through the graph.

    ``total=False`` means every key is optional — each node only needs to fill
    in the fields it produces. Downstream nodes read what they need.
    """

    user_prompt: str
    identified_needs: Optional[NeedsResult]
    matched_products: Optional[MatchResult]
    cart_plan: Optional[CartPlan]


def identify_needs_node(state: CartAgentState) -> dict:
    """Subagent 1 wrapped as a LangGraph node."""
    needs = identify_needs(state["user_prompt"])
    return {"identified_needs": needs}


def match_catalog_node(state: CartAgentState) -> dict:
    """Subagent 2 wrapped as a LangGraph node."""
    needs = state.get("identified_needs")
    if needs is None:
        return {"matched_products": MatchResult(matches=[], unmatched_needs=[])}
    return {"matched_products": match_catalog(needs)}


def build_cart_node(state: CartAgentState) -> dict:
    """Subagent 3 wrapped as a LangGraph node."""
    needs = state.get("identified_needs")
    matches = state.get("matched_products")
    if needs is None or matches is None:
        return {"cart_plan": CartPlan(items=[], suggestions=[], message="")}
    plan = build_cart(state["user_prompt"], needs, matches)
    return {"cart_plan": plan}


def build_graph():
    """Compile the LangGraph state graph for the cart agent."""
    builder = StateGraph(CartAgentState)
    builder.add_node("identify_needs", identify_needs_node)
    builder.add_node("match_catalog", match_catalog_node)
    builder.add_node("build_cart", build_cart_node)
    builder.add_edge(START, "identify_needs")
    builder.add_edge("identify_needs", "match_catalog")
    builder.add_edge("match_catalog", "build_cart")
    builder.add_edge("build_cart", END)
    return builder.compile()


_compiled = None


def run_agent(user_prompt: str) -> CartAgentState:
    """Run the full agent pipeline end-to-end and return the final state."""
    global _compiled
    if _compiled is None:
        _compiled = build_graph()
    return _compiled.invoke({"user_prompt": user_prompt})


def _pretty_print(state: CartAgentState) -> None:
    needs = state.get("identified_needs")
    if needs is not None:
        print(f"\nRationale: {needs.rationale}\n")
        print(f"Identified {len(needs.needs)} need(s):")
        for i, need in enumerate(needs.needs, 1):
            print(f"  {i}. [{need.category:>10}] {need.item} — {need.reason}")

    matches = state.get("matched_products")
    if matches is not None:
        print(f"\nMatched {len(matches.matches)} product(s):")
        for i, m in enumerate(matches.matches, 1):
            print(
                f"  {i}. need='{m.need_item}' -> #{m.product_id} {m.product_title} "
                f"x{m.quantity}  [{m.confidence}]"
            )
        if matches.unmatched_needs:
            print(f"  Unmatched: {', '.join(matches.unmatched_needs)}")

    plan = state.get("cart_plan")
    if plan is not None:
        print(f"\nMessage: {plan.message}")
        print(f"\nFinal cart ({len(plan.items)} item(s), ~${plan.total_estimated_cost_usd:.2f}):")
        for i, item in enumerate(plan.items, 1):
            print(f"  {i}. #{item.id} {item.title} x{item.quantity}  @ ${item.price:.2f}")
            print(f"       {item.rationale}")
        if plan.suggestions:
            print("  Suggestions:")
            for s in plan.suggestions:
                print(f"    - {s}")
    print()


if __name__ == "__main__":
    prompt = " ".join(sys.argv[1:]) or "I am sick, having fever"
    print(f"Prompt: {prompt}")
    print("Running graph ...")
    final_state = run_agent(prompt)
    _pretty_print(final_state)
