"""Semantic retriever — vector similarity over Gemini embeddings.

Catches synonyms and conceptual neighbors that BM25 misses
(e.g. "warm comforting drink" -> "Soft Drinks", "fruit for vitamin c" -> "Lemon").

Embeddings are computed once (the first time ``search`` is called) and cached
to disk under ``data/embeddings.json``. Delete that file to force a rebuild.
"""

from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import List, Tuple

import numpy as np
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from pydantic import SecretStr

from app.catalog.source import get_catalog
from app.config import GEMINI_EMBEDDING_MODEL
from app.models import CatalogProduct

# `text-embedding-004` was retired in Jan 2026; `gemini-embedding-001` is the
# default text-only replacement. Override via GEMINI_EMBEDDING_MODEL env var.
# See: https://ai.google.dev/gemini-api/docs/embeddings
EMBEDDING_MODEL = GEMINI_EMBEDDING_MODEL

_AGENT_ROOT = Path(__file__).resolve().parents[2]
_CACHE_PATH = _AGENT_ROOT / "data" / "embeddings.json"


def _embed_text(text: str) -> List[float]:
    """Embed a single string. Used at query time."""
    embedder = _get_embedder()
    return embedder.embed_query(text)


@lru_cache(maxsize=1)
def _get_embedder() -> GoogleGenerativeAIEmbeddings:
    """Construct the Gemini embedding client once per process.

    ``langchain-google-genai`` doesn't autoload ``.env`` and is picky about
    where the API key comes from, so we read it explicitly and pass it in.
    """
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GOOGLE_API_KEY (or GEMINI_API_KEY) is not set. Add it to agent/.env "
            "(see agent/.env.example) before running the embedding retriever."
        )
    return GoogleGenerativeAIEmbeddings(
        model=EMBEDDING_MODEL,
        google_api_key=SecretStr(api_key),
    )


def _product_text(product: CatalogProduct) -> str:
    """The text representation we embed for a product."""
    parts = [product.title, product.description]
    if product.brand:
        parts.append(f"Brand: {product.brand}")
    if product.tags:
        parts.append(f"Tags: {', '.join(product.tags)}")
    return " ".join(parts)


def _load_cache() -> dict | None:
    if not _CACHE_PATH.exists():
        return None
    try:
        with _CACHE_PATH.open("r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return None


def _save_cache(cache: dict) -> None:
    _CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with _CACHE_PATH.open("w", encoding="utf-8") as f:
        json.dump(cache, f)


def _build_or_load_index() -> Tuple[np.ndarray, List[CatalogProduct]]:
    """Return (matrix of L2-normalized vectors, parallel list of products)."""
    catalog = get_catalog()
    catalog_signature = sorted(p.id for p in catalog)

    cache = _load_cache()
    if (
        cache is not None
        and cache.get("model") == EMBEDDING_MODEL
        and cache.get("ids") == catalog_signature
    ):
        vectors = np.asarray(cache["vectors"], dtype=np.float32)
        return vectors, catalog

    print(
        f"[semantic] Embedding {len(catalog)} catalog products with {EMBEDDING_MODEL} "
        f"(one-time, cached to {_CACHE_PATH.relative_to(_AGENT_ROOT)})..."
    )
    embedder = _get_embedder()
    raw_vectors = embedder.embed_documents([_product_text(p) for p in catalog])
    vectors = np.asarray(raw_vectors, dtype=np.float32)

    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    vectors = vectors / norms

    _save_cache(
        {
            "model": EMBEDDING_MODEL,
            "ids": catalog_signature,
            "vectors": vectors.tolist(),
        }
    )
    return vectors, catalog


@lru_cache(maxsize=1)
def _index_cached() -> Tuple[np.ndarray, List[CatalogProduct]]:
    return _build_or_load_index()


def search(query: str, top_k: int = 3) -> List[CatalogProduct]:
    """Return the top-K products by cosine similarity to ``query``."""
    if not query.strip():
        return []
    vectors, catalog = _index_cached()
    raw_query_vec = np.asarray(_embed_text(query), dtype=np.float32)
    norm = np.linalg.norm(raw_query_vec) or 1.0
    query_vec = raw_query_vec / norm

    sims = vectors @ query_vec
    top_indices = np.argsort(sims)[::-1][:top_k]
    return [catalog[int(i)] for i in top_indices]


if __name__ == "__main__":
    import sys

    queries = sys.argv[1:] or [
        "fever medication",
        "warm comforting drink",
        "snack for movie night",
    ]
    for q in queries:
        print(f"\nQuery: {q}")
        for hit in search(q):
            print(f"  -> {hit.id:>3}  {hit.title}")
