# Amazon Now Agent Service

A Python FastAPI service that powers the Amazon Now intent-based shopping
assistant. Uses LangGraph + LangChain with Google Gemini.

When a user types something like _"I am sick, having fever"_, the agent:

1. **Identifies needs** — translates symptoms / intent into required items (Subagent 1)
2. **Matches catalog** — finds the closest products in the DummyJSON catalog using a
   production-style retrieval pipeline (Subagent 2):
   - **Lexical retrieval** (BM25) — top 3 candidates per need by keyword score
   - **Semantic retrieval** (Gemini `gemini-embedding-001`) — top 3 candidates by vector similarity
   - **LLM rerank** — Gemini picks the single best candidate per need, with confidence + rationale
3. **Builds cart** — Subagent 3 curates the final cart: drops weak matches, sets
   sensible quantities, writes a friendly message, and suggests alternatives for
   needs the catalog doesn't cover. The HTTP response carries the full hydrated
   cart payload, ready for the frontend to dispatch into local cart state.

```
"I am sick, having fever"
   │
   ▼
LangGraph: identify_needs ──► match_catalog ──► build_cart ──► HTTP response
            (Subagent 1)       (Subagent 2)      (Subagent 3)
```

## Quick start

```bash
# Once, from this folder:
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Copy the example env file and fill in your key
cp .env.example .env
# Open .env and paste your GOOGLE_API_KEY (from https://aistudio.google.com/apikey)
```

## Run the server

```bash
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

The API will be available at http://localhost:8000 and Swagger UI at
http://localhost:8000/docs.

### Endpoints

| Method | Path                | What it does                                          |
| ------ | ------------------- | ----------------------------------------------------- |
| GET    | `/health`           | Liveness probe                                        |
| POST   | `/identify-needs`   | Just Subagent 1 — needs only                          |
| POST   | `/run-cart-agent`   | Full pipeline — needs + matches + curated cart plan   |

Example:

```bash
curl -X POST http://localhost:8000/run-cart-agent \
  -H "Content-Type: application/json" \
  -d '{"prompt": "I am sick, having fever"}'
```

## Catalog embeddings cache

The first time Subagent 2 runs it embeds every catalog product with Gemini and
caches the vectors to `agent/data/embeddings.json`. Subsequent runs reuse that
file — no re-embedding cost. Delete the file (or change the catalog) to force a
rebuild.

To pre-warm the cache offline (recommended before a demo):

```bash
source .venv/bin/activate
python -m app.catalog.semantic "fever medicine"
```

## Smoke-test each piece individually

```bash
# Subagent 1 alone
python -m app.agents.needs_identifier "I am sick, having fever"

# Retrievers alone (no LLM call)
python -m app.catalog.lexical  honey lemon rice
python -m app.catalog.semantic "fever medication"

# Subagent 2 (runs Subagent 1 first, then matches)
python -m app.agents.catalog_matcher "I am sick, having fever"

# Subagent 3 (runs Subagents 1 + 2 first, then curates the final cart)
python -m app.agents.cart_builder "I am sick, having fever"

# Full graph end-to-end
python -m app.graph "I am sick, having fever"
```

## Project layout

```
agent/
├── requirements.txt
├── .env                    (gitignored — your Gemini key)
├── .env.example            (committed)
├── data/
│   └── embeddings.json     (gitignored — auto-generated catalog vectors)
└── app/
    ├── main.py             FastAPI app
    ├── graph.py            LangGraph state graph (identify_needs -> match_catalog)
    ├── models.py           Pydantic schemas (state, request, response)
    ├── agents/
    │   ├── needs_identifier.py   Subagent 1: prompt -> structured needs
    │   ├── catalog_matcher.py    Subagent 2: needs -> matched products
    │   └── cart_builder.py       Subagent 3: matches -> curated cart plan
    └── catalog/
        ├── source.py        DummyJSON fetch + in-memory cache
        ├── lexical.py       BM25 retriever
        └── semantic.py      Gemini-embedding retriever (disk-cached)
```
