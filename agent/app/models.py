"""Pydantic schemas for the Amazon Now agent.

These define the structured outputs we expect from each subagent
and the request/response shapes for the FastAPI endpoints.
"""

from typing import List, Literal, Optional

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

MatchConfidence = Literal["high", "medium", "low"]


# ---------------------------------------------------------------------------
# Subagent 1 (Needs Identifier)
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# Catalog (DummyJSON groceries)
# ---------------------------------------------------------------------------


class CatalogProduct(BaseModel):
    """A normalized product from the upstream catalog (DummyJSON groceries)."""

    id: int
    title: str
    price: float = Field(description="Price as returned by upstream (USD).")
    discount_percentage: float = 0.0
    thumbnail: str
    description: str
    brand: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Subagent 2 (Catalog Matcher)
# ---------------------------------------------------------------------------


class MatchedItem(BaseModel):
    """A single product matched to one of the identified needs."""

    need_item: str = Field(
        description="The original ``need.item`` string this match was generated for."
    )
    product_id: int = Field(description="DummyJSON product id of the chosen product.")
    product_title: str = Field(description="Display title of the chosen product.")
    quantity: int = Field(default=1, ge=1, description="How many units to add to cart.")
    confidence: MatchConfidence = Field(
        description="How well the product matches the need: high/medium/low."
    )
    rationale: str = Field(
        description="One-sentence explanation of why this product was chosen for this need."
    )


class MatchResult(BaseModel):
    """Output of the Catalog Matcher subagent (Subagent 2)."""

    matches: List[MatchedItem] = Field(
        default_factory=list,
        description="Products selected for the needs we could match.",
    )
    unmatched_needs: List[str] = Field(
        default_factory=list,
        description="Needs that had no good catalog match (e.g. paracetamol, ORS).",
    )


# ---------------------------------------------------------------------------
# Subagent 3 (Cart Builder)
# ---------------------------------------------------------------------------


class CartCuratorPick(BaseModel):
    """A single LLM decision: keep this matched product, with adjusted quantity."""

    product_id: int = Field(description="DummyJSON product id (must come from matches).")
    quantity: int = Field(ge=1, le=10, description="Final quantity to put in the cart.")
    rationale: str = Field(
        description="One short sentence explaining why this is in the cart, "
                    "phrased for a human shopper."
    )


class CartCuratorDraft(BaseModel):
    """Raw structured output from the LLM curator (before we hydrate product details)."""

    items: List[CartCuratorPick] = Field(default_factory=list)
    suggestions: List[str] = Field(
        default_factory=list,
        description="Bullet-style alternatives for unmatched needs, e.g. "
                    "'paracetamol — try our pharmacy partner'.",
    )
    message: str = Field(
        description="A friendly 1-2 sentence summary the frontend can show to the user."
    )


class CartLineItem(BaseModel):
    """A fully hydrated cart item ready for the frontend Redux/local store.

    Field names match the frontend's ``StoreProduct`` / Amazon-Now ``NowProduct``
    shapes so dispatching is trivial.
    """

    id: int
    title: str
    price: float = Field(description="Price as USD from DummyJSON. Frontend converts to INR.")
    description: str
    category: str
    image: str
    quantity: int
    rationale: str


class CartPlan(BaseModel):
    """Final cart payload returned by Subagent 3."""

    items: List[CartLineItem] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    message: str = ""
    total_estimated_cost_usd: float = 0.0


# ---------------------------------------------------------------------------
# FastAPI request / response shapes
# ---------------------------------------------------------------------------


class IdentifyNeedsRequest(BaseModel):
    """POST body for the /identify-needs FastAPI endpoint."""

    prompt: str = Field(
        description="Free-text user input, e.g. 'I am sick, having fever'.",
        min_length=1,
    )


class RunCartAgentRequest(BaseModel):
    """POST body for /run-cart-agent (the full pipeline: needs -> matches)."""

    prompt: str = Field(min_length=1)


class RunCartAgentResponse(BaseModel):
    """Full pipeline response across all three subagents."""

    needs: NeedsResult
    matches: MatchResult
    cart: CartPlan
