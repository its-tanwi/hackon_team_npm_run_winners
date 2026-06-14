"""Centralized config for the agent service.

Right now this is just a single source of truth for the Gemini model name
so all three subagents stay in sync and you can swap models from ``.env``
without touching code.
"""

from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()

# Default to gemini-2.5-flash — generous free-tier daily quota and works well
# with `with_structured_output`. Override by setting GEMINI_MODEL in agent/.env.
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

# Embedding model is separate (see app/catalog/semantic.py).
GEMINI_EMBEDDING_MODEL: str = os.getenv(
    "GEMINI_EMBEDDING_MODEL", "gemini-embedding-001"
).strip()
