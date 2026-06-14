/**
 * Client for the Python LangGraph agent service (FastAPI on port 8000 by default).
 *
 * Types here mirror the Pydantic schemas in `agent/app/models.py`. If you change
 * one, change the other.
 */

const DEFAULT_AGENT_BASE_URL = "http://localhost:8000";

export const AGENT_BASE_URL =
    (typeof process !== "undefined" &&
        process.env.NEXT_PUBLIC_AGENT_BASE_URL) ||
    DEFAULT_AGENT_BASE_URL;

const USD_TO_INR = 85;

// ---------------------------------------------------------------------------
// Types — keep in sync with agent/app/models.py
// ---------------------------------------------------------------------------

export type NeedCategory =
    | "medicine"
    | "produce"
    | "pantry"
    | "dairy"
    | "beverage"
    | "household"
    | "snacks"
    | "other";

export interface IdentifiedNeed {
    item: string;
    category: NeedCategory;
    reason: string;
}

export interface NeedsResult {
    needs: IdentifiedNeed[];
    rationale: string;
}

export type MatchConfidence = "high" | "medium" | "low";

export interface MatchedItem {
    need_item: string;
    product_id: number;
    product_title: string;
    quantity: number;
    confidence: MatchConfidence;
    rationale: string;
}

export interface MatchResult {
    matches: MatchedItem[];
    unmatched_needs: string[];
}

/** Server-side cart line item — prices are in USD straight from DummyJSON. */
export interface CartLineItem {
    id: number;
    title: string;
    price: number;
    description: string;
    category: string;
    image: string;
    quantity: number;
    rationale: string;
}

export interface CartPlan {
    items: CartLineItem[];
    suggestions: string[];
    message: string;
    total_estimated_cost_usd: number;
}

export interface RunCartAgentResponse {
    needs: NeedsResult;
    matches: MatchResult;
    cart: CartPlan;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

/** Convert a USD price from the agent into INR for display in ₹. */
export const usdToInr = (usd: number): number => Math.round(usd * USD_TO_INR);

/**
 * Map a server cart item into the local Amazon-Now ``NowProduct`` shape so it
 * can be added to the page's local cart state alongside organic adds.
 */
export const cartItemToNowProduct = (item: CartLineItem) => {
    const inr = usdToInr(item.price);
    return {
        id: item.id,
        title: item.title,
        weight: "1 pack",
        price: inr,
        mrp: inr,
        discountPct: 0,
        image: item.image,
    };
};

// ---------------------------------------------------------------------------
// API call
// ---------------------------------------------------------------------------

export class AgentRequestError extends Error {
    constructor(message: string, readonly status?: number) {
        super(message);
        this.name = "AgentRequestError";
    }
}

export const runCartAgent = async (
    prompt: string,
    signal?: AbortSignal
): Promise<RunCartAgentResponse> => {
    const trimmed = prompt.trim();
    if (!trimmed) {
        throw new AgentRequestError("Please enter what you need.");
    }

    let response: Response;
    try {
        response = await fetch(`${AGENT_BASE_URL}/run-cart-agent`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: trimmed }),
            signal,
        });
    } catch (err) {
        const message =
            err instanceof Error && err.name === "AbortError"
                ? "Request cancelled."
                : "Couldn't reach the assistant. Make sure the agent service is running on " +
                  `${AGENT_BASE_URL}.`;
        throw new AgentRequestError(message);
    }

    if (!response.ok) {
        let detail = `Assistant returned HTTP ${response.status}.`;
        try {
            const body = await response.json();
            if (body?.detail) detail = String(body.detail);
        } catch {
            // ignore JSON parse errors; keep the default detail
        }
        if (response.status === 429) {
            detail =
                detail ||
                "We've hit today's AI quota. Please try again later or switch GEMINI_MODEL in agent/.env.";
        }
        throw new AgentRequestError(detail, response.status);
    }

    return (await response.json()) as RunCartAgentResponse;
};
