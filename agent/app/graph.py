"""LangGraph state graph wiring all subagents together.

Today this graph has just one node (Subagent 1 - Needs Identifier). The
scaffolding is intentionally set up so that adding Subagent 2 (catalog matcher)
and Subagent 3 (cart builder) later is a matter of dropping in another
``add_node`` + ``add_edge`` call.
"""

from __future__ import annotations

import sys
from typing import Optional, TypedDict

from langgraph.graph import END, START, StateGraph

from app.agents.needs_identifier import identify_needs
from app.models import NeedsResult


class CartAgentState(TypedDict, total=False):
    """State that flows through the graph.

    ``total=False`` means every key is optional — nodes only need to fill in
    the fields they care about. Other nodes downstream can read them.
    """

    user_prompt: str
    identified_needs: Optional[NeedsResult]

    # Reserved for future subagents:
    # matched_products: list
    # cart_items: list


def identify_needs_node(state: CartAgentState) -> dict:
    """Subagent 1 wrapped as a LangGraph node.

    Reads ``state['user_prompt']``, runs the LLM, and returns a partial state
    dict. LangGraph merges this dict into the running state automatically.
    """
    needs = identify_needs(state["user_prompt"])
    return {"identified_needs": needs}


def build_graph():
    """Compile the LangGraph state graph for the cart agent."""
    builder = StateGraph(CartAgentState)
    builder.add_node("identify_needs", identify_needs_node)
    builder.add_edge(START, "identify_needs")
    builder.add_edge("identify_needs", END)
    return builder.compile()


# Cache the compiled graph so we only build it once per process.
_compiled = None


def run_agent(user_prompt: str) -> CartAgentState:
    """Run the agent end-to-end and return the final state."""
    global _compiled
    if _compiled is None:
        _compiled = build_graph()
    return _compiled.invoke({"user_prompt": user_prompt})


def _pretty_print(state: CartAgentState) -> None:
    needs = state.get("identified_needs")
    if needs is None:
        print("No needs were identified.")
        return
    print(f"\nRationale: {needs.rationale}\n")
    print(f"Identified {len(needs.needs)} need(s):")
    for i, need in enumerate(needs.needs, 1):
        print(f"  {i}. [{need.category:>10}] {need.item} — {need.reason}")
    print()


if __name__ == "__main__":
    prompt = " ".join(sys.argv[1:]) or "I am sick, having fever"
    print(f"Prompt: {prompt}")
    print("Running graph ...")
    final_state = run_agent(prompt)
    _pretty_print(final_state)
