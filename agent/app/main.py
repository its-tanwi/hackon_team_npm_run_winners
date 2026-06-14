"""FastAPI entry point for the Amazon Now agent service.

Run locally with::

    uvicorn app.main:app --reload --port 8000

Then in another terminal::

    curl -X POST http://localhost:8000/run-cart-agent \\
      -H "Content-Type: application/json" \\
      -d '{"prompt": "I am sick, having fever"}'

Or open http://localhost:8000/docs for the auto-generated Swagger UI.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.graph import run_agent
from app.models import (
    IdentifyNeedsRequest,
    NeedsResult,
    RunCartAgentRequest,
    RunCartAgentResponse,
)

logger = logging.getLogger("amazon-now-agent")


def _translate_llm_error(exc: Exception) -> HTTPException:
    """Map common Gemini failures into clean HTTP errors with friendly messages."""
    text = str(exc)
    if "RESOURCE_EXHAUSTED" in text or "429" in text:
        return HTTPException(
            status_code=429,
            detail=(
                "We've hit today's free-tier Gemini quota. Please try again "
                "in a few minutes, switch GEMINI_MODEL in agent/.env (e.g. to "
                "gemini-2.0-flash-lite), or enable billing on the API key."
            ),
        )
    if "API key" in text or "PERMISSION_DENIED" in text:
        return HTTPException(
            status_code=401,
            detail="Gemini API key is missing or invalid. Check agent/.env (GOOGLE_API_KEY).",
        )
    return HTTPException(
        status_code=502,
        detail=f"Upstream LLM error: {text[:300]}",
    )

app = FastAPI(
    title="Amazon Now Agent",
    description=(
        "LangGraph + Gemini agent that turns a free-text user request "
        "(e.g. 'I am sick, having fever') into a structured shopping cart."
    ),
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    """Lightweight liveness check used by the frontend / orchestration."""
    return {"status": "ok"}


@app.post("/identify-needs", response_model=NeedsResult)
def identify_needs_endpoint(req: IdentifyNeedsRequest) -> NeedsResult:
    """Run only Subagent 1 (Needs Identifier) — useful for debugging."""
    try:
        state = run_agent(req.prompt)
    except Exception as exc:
        logger.exception("identify_needs failed")
        raise _translate_llm_error(exc)
    needs = state.get("identified_needs")
    if needs is None:
        raise HTTPException(
            status_code=500,
            detail="Needs Identifier did not produce any output.",
        )
    return needs


@app.post("/run-cart-agent", response_model=RunCartAgentResponse)
def run_cart_agent_endpoint(req: RunCartAgentRequest) -> RunCartAgentResponse:
    """Run the full pipeline: identify needs -> match catalog -> build cart."""
    try:
        state = run_agent(req.prompt)
    except Exception as exc:
        logger.exception("run-cart-agent failed")
        raise _translate_llm_error(exc)
    needs = state.get("identified_needs")
    matches = state.get("matched_products")
    cart = state.get("cart_plan")
    if needs is None or matches is None or cart is None:
        raise HTTPException(
            status_code=500,
            detail="Agent pipeline did not produce a complete result.",
        )
    return RunCartAgentResponse(needs=needs, matches=matches, cart=cart)
