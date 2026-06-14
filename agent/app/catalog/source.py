"""Catalog source — fetches and caches the DummyJSON groceries catalog.

This is the single source of truth for "what products are available". Both
retrievers (BM25 and embeddings) read from here.

We cache in-memory for the lifetime of the process; the DummyJSON catalog is
small and effectively static.
"""

from __future__ import annotations

import time
from functools import lru_cache
from typing import List

import httpx

from app.models import CatalogProduct

DUMMY_JSON_URL = "https://dummyjson.com/products/category/groceries?limit=100"
REQUEST_TIMEOUT = httpx.Timeout(30.0, connect=10.0)
MAX_ATTEMPTS = 3
BACKOFF_SECONDS = 1.5


def _normalize(raw: dict) -> CatalogProduct:
    """Map a raw DummyJSON product dict into our typed ``CatalogProduct``."""
    return CatalogProduct(
        id=raw["id"],
        title=raw["title"],
        price=raw.get("price", 0.0),
        discount_percentage=raw.get("discountPercentage", 0.0),
        thumbnail=raw.get("thumbnail", ""),
        description=raw.get("description", ""),
        brand=raw.get("brand"),
        tags=list(raw.get("tags", [])),
    )


@lru_cache(maxsize=1)
def get_catalog() -> List[CatalogProduct]:
    """Fetch the catalog (once per process) and return normalized products.

    DummyJSON occasionally cold-starts slowly, so we retry on timeouts /
    transient HTTP errors with a small backoff before giving up.
    """
    last_error: Exception | None = None
    headers = {"User-Agent": "amazon-now-agent/0.2 (+httpx)"}
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            with httpx.Client(timeout=REQUEST_TIMEOUT, headers=headers) as client:
                response = client.get(DUMMY_JSON_URL)
            response.raise_for_status()
            data = response.json()
            return [_normalize(p) for p in data.get("products", [])]
        except (httpx.TimeoutException, httpx.HTTPError) as exc:
            last_error = exc
            if attempt < MAX_ATTEMPTS:
                wait = BACKOFF_SECONDS * attempt
                print(
                    f"[catalog] fetch attempt {attempt}/{MAX_ATTEMPTS} failed "
                    f"({exc.__class__.__name__}); retrying in {wait:.1f}s..."
                )
                time.sleep(wait)
    raise RuntimeError(
        f"Failed to fetch catalog from {DUMMY_JSON_URL} after {MAX_ATTEMPTS} attempts"
    ) from last_error


def get_product_by_id(product_id: int) -> CatalogProduct | None:
    """Look up a single product by id from the cached catalog."""
    for product in get_catalog():
        if product.id == product_id:
            return product
    return None


if __name__ == "__main__":
    catalog = get_catalog()
    print(f"Loaded {len(catalog)} products from DummyJSON groceries:")
    for p in catalog:
        print(f"  {p.id:>3}  {p.title:<25}  ${p.price:>6.2f}")
