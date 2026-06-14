"""Pydantic schemas for the Amazon Now agent.

These define the structured outputs we expect from each subagent
and the request/response shapes for the FastAPI endpoints.
"""

from typing import List, Literal

from pydantic import BaseModel, Field

NeedCategory = Literal[
    "medicine",   # OTC drugs, vitamins, ORS, etc.
    "produce",    # fresh fruits / vegetables
    "pantry",     # honey, sugar, atta, oats, etc.
    "dairy",      # milk, yogurt, paneer, eggs
    "beverage",   # juice, soup, electrolyte drinks, water
    "household",  # tissues, sanitizer, detergent, soap
    "snacks",     # easy-to-eat foods (biscuits, crackers)
    "other",
]


class IdentifiedNeed(BaseModel):
    """A single item the user is likely to need."""

    item: str = Field(
        description="Generic name of the item, e.g. 'paracetamol', 'lemon', 'honey'. "
                    "Use lowercase common names, not brand names."
    )
    category: NeedCategory = Field(
        description="Broad category that helps the catalog matcher narrow its search."
    )
    reason: str = Field(
        description="One short sentence explaining why this item is relevant to the user's situation."
    )


class NeedsResult(BaseModel):
    """Output of the Needs Identifier subagent (Subagent 1)."""

    needs: List[IdentifiedNeed] = Field(
        description="4-8 items that the user should have on hand to address their situation."
    )
    rationale: str = Field(
        description="A brief 1-2 sentence summary of what the user is dealing with and how the items will help."
    )


class IdentifyNeedsRequest(BaseModel):
    """POST body for the /identify-needs FastAPI endpoint."""

    prompt: str = Field(
        description="Free-text user input, e.g. 'I am sick, having fever'.",
        min_length=1,
    )
