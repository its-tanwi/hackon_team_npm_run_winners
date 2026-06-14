# Amazon Clone with Smart Cart Assistant

An Amazon-style e-commerce app with two flagship features beyond the standard
catalog browse:

1. **Amazon Now** — a quick-commerce mode at `/amazon-now` with grocery
   categories, live search, INR pricing, and a sticky cart footer.
2. **Smart Cart Assistant** — a LangGraph + Gemini agent that turns a free-text
   prompt like _"I am sick, having fever"_ or _"planning a movie night"_ into a
   curated, editable cart with one click.

The app is split into two services that run side by side during development:

- **Frontend** — Next.js (Pages Router) + Tailwind + Redux Toolkit + Firebase Auth.
- **Agent service** — Python FastAPI + LangGraph + LangChain orchestrating three
  Gemini-backed subagents.

---

## How the Smart Cart Assistant works

When a user types a request, three subagents run in sequence inside a single
LangGraph state machine:

```
"I am sick, having fever"
   |
   v
identify_needs --> match_catalog --> build_cart --> HTTP response
 (Subagent 1)      (Subagent 2)      (Subagent 3)
```

| Subagent | What it does |
| --- | --- |
| **Needs Identifier** | Maps the prompt to a structured list of items the user is likely to need (item, category, reason). |
| **Catalog Matcher** | Production-style retrieval pipeline: top-K candidates from BM25 + Gemini embeddings (cached to disk), then Gemini reranks the small candidate set with strict structured output and refuses to force matches it isn't sure about. |
| **Cart Builder** | LLM curator that decides final quantities, drops weak picks, writes a friendly chat message, and proposes alternatives for needs the catalog doesn't carry. Prices and totals are computed deterministically so the LLM cannot invent a price or product id. |

The frontend `/amazon-now` page exposes this through a Smart Cart Assistant
card. Users can review the proposed cart, adjust quantities (+/-), remove
items, and confirm before anything lands in the local cart.

---

## Repository layout

```
.
|-- src/
|   |-- pages/
|   |   |-- amazon-now.tsx          Quick-commerce + Smart Cart entry point
|   |   |-- index.tsx               Main Amazon-style storefront
|   |   `-- ...
|   |-- components/
|   |   |-- amazon-now/
|   |   |   |-- AgentChat.tsx       Smart Cart Assistant input card
|   |   |   |-- AgentResultModal.tsx Cart preview with edit/remove controls
|   |   |   |-- NowHeader.tsx
|   |   |   |-- ProductCard.tsx
|   |   |   `-- ...
|   |   `-- ...
|   |-- lib/
|   |   |-- agentApi.ts             Typed client for the Python agent service
|   |   |-- amazonNowApi.ts         DummyJSON groceries fetch + categorization
|   |   `-- firebase.ts             Firebase init
|   |-- store/
|   |   `-- nextSlice.ts            Redux Toolkit slice (cart, favorites, user)
|   `-- styles/, hooks/, type.d.ts
|
|-- agent/                          Python FastAPI + LangGraph service
|   |-- app/
|   |   |-- main.py                 FastAPI app, /run-cart-agent endpoint
|   |   |-- graph.py                LangGraph state graph wiring all 3 nodes
|   |   |-- config.py               GEMINI_MODEL / GEMINI_EMBEDDING_MODEL
|   |   |-- models.py               Pydantic schemas (state, request, response)
|   |   |-- agents/
|   |   |   |-- needs_identifier.py   Subagent 1
|   |   |   |-- catalog_matcher.py    Subagent 2
|   |   |   `-- cart_builder.py       Subagent 3
|   |   `-- catalog/
|   |       |-- source.py           DummyJSON fetch + cache
|   |       |-- lexical.py          BM25 retriever
|   |       `-- semantic.py         Gemini embedding retriever (disk-cached)
|   |-- requirements.txt
|   |-- .env.example
|   `-- README.md                   Detailed agent docs
|
|-- public/                         Static assets (incl. amazon-now.png)
|-- tailwind.config.ts
`-- README.md (this file)
```

---

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+ (3.14 is what's currently used)
- A **Firebase** project with Email/Google sign-in enabled
- A **Google AI Studio** API key for Gemini
  (free tier works: https://aistudio.google.com/apikey)

---

## Setup

### 1. Frontend

```bash
npm install
```

Create `.env.local` in the repo root with your Firebase project keys and
the agent base URL:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...

NEXT_PUBLIC_AGENT_BASE_URL=http://localhost:8000
```

### 2. Agent service

```bash
cd agent
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

cp .env.example .env
# Open .env and paste your Gemini API key (GOOGLE_API_KEY)
# Optional: override GEMINI_MODEL or GEMINI_EMBEDDING_MODEL
```

See [`agent/README.md`](agent/README.md) for full details (smoke tests,
embeddings cache, troubleshooting Gemini quotas, etc.).

---

## Running locally

You need three terminals during normal development:

```bash
# Terminal 1 - Next.js frontend
npm run dev
# -> http://localhost:3000

# Terminal 2 - Python agent service
cd agent && source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
# -> http://localhost:8000  (Swagger UI at /docs)

# Terminal 3 - whatever (curl, tests, git, etc.)
```

Then open http://localhost:3000/amazon-now and try the Smart Cart Assistant
with a prompt like `I am sick, having fever` or `planning a movie night`.

---

## Tech stack

**Frontend**
- Next.js 15 (Pages Router) + TypeScript
- Tailwind CSS with the Amazon palette (`amazon_blue`, `amazon_yellow`, `amazon_light`)
- Redux Toolkit for cart / favorites / user state
- Firebase Auth (Google sign-in with redirect fallback for popup-blocked browsers)
- DummyJSON groceries API for live product data (with INR conversion)

**Agent service**
- Python 3.14, FastAPI, Uvicorn
- LangGraph for orchestrating the 3-subagent state machine
- LangChain + `langchain-google-genai` for Gemini chat + embeddings
- `rank-bm25` for lexical retrieval, NumPy for cosine similarity
- Pydantic v2 for typed request/response and structured LLM output

---

## Notes

- The catalog used by the agent is the same DummyJSON groceries dataset
  (~30 items). It's intentionally small to keep retrieval costs near zero
  and showcase the multi-stage pipeline. Swapping in a real catalog is a
  matter of changing `agent/app/catalog/source.py`.
- Embeddings are cached to `agent/data/embeddings.json` (gitignored) on
  first run so subsequent agent calls don't re-embed.
- Gemini free-tier quotas are per-model and reset daily. If you hit a 429,
  the API surfaces a friendly message and you can switch model via
  `GEMINI_MODEL` in `agent/.env`.
