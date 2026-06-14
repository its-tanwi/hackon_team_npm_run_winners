"""Lexical retriever — BM25 over product title + description.

Cheap, deterministic candidate generation that catches direct word matches
("honey" -> Honey Jar, "lemon" -> Lemon, "rice" -> Rice).
"""

from __future__ import annotations

import re
from functools import lru_cache
from typing import List, Tuple

from rank_bm25 import BM25Okapi

from app.catalog.source import get_catalog
from app.models import CatalogProduct

_TOKEN_RE = re.compile(r"[a-z0-9]+")


def _tokenize(text: str) -> List[str]:
    """Lowercase + split on non-alphanumerics. Good enough for product titles."""
    return _TOKEN_RE.findall(text.lower())


@lru_cache(maxsize=1)
def _build_index() -> Tuple[BM25Okapi, List[CatalogProduct]]:
    """Build a BM25 index over the cached catalog."""
    catalog = get_catalog()
    corpus = [
        _tokenize(f"{p.title}. {p.description}. {' '.join(p.tags)}")
        for p in catalog
    ]
    return BM25Okapi(corpus), catalog


def search(query: str, top_k: int = 3) -> List[CatalogProduct]:
    """Return the top-K products by BM25 score for ``query``."""
    index, catalog = _build_index()
    tokens = _tokenize(query)
    if not tokens:
        return []
    scores = index.get_scores(tokens)
    if all(score <= 0 for score in scores):
        return []
    ranked = sorted(zip(scores, catalog), key=lambda pair: pair[0], reverse=True)
    return [product for score, product in ranked[:top_k] if score > 0]


if __name__ == "__main__":
    import sys

    queries = sys.argv[1:] or ["honey", "fever", "fruit", "drink"]
    for q in queries:
        print(f"\nQuery: {q}")
        for hit in search(q):
            print(f"  -> {hit.id:>3}  {hit.title}")
