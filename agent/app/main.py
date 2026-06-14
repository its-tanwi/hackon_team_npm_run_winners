"""FastAPI entry point for the Amazon Now agent service.

Run locally with::

    uvicorn app.main:app --reload --port 8000

Then in another terminal::

    curl -X POST http://localhost:8000/identify-needs \\
      -H "Content-Type: application/json" \\
      -d '{"prompt": "I am sick, having fever"}'

Or open http://localhost:8000/docs for the auto-generated Swagger UI.
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.graph import run_agent
from app.models import IdentifyNeedsRequest, NeedsResult

app = FastAPI(
    title="Amazon Now Agent",
    description=(
        "LangGraph + Gemini agent that turns a free-text user request "
        "(e.g. 'I am sick, having fever') into a structured shopping cart."
    ),
    version="0.1.0",
)

# Allow the Next.js dev server to call us during development.
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
    """Run Subagent 1 and return the identified needs.

    This is the only LangGraph entrypoint exposed in Step 1. As Subagents 2
    and 3 land, they'll be reachable through additional endpoints (or this
    one will return a richer payload).
    """
    state = run_agent(req.prompt)
    needs = state.get("identified_needs")
    if needs is None:
        raise HTTPException(
            status_code=500,
            detail="Needs Identifier did not produce any output.",
        )
    return needs
