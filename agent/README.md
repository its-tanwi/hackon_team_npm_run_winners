# Amazon Now Agent Service

A Python FastAPI service that powers the Amazon Now intent-based shopping
assistant. Uses LangGraph + LangChain with Google Gemini.

When a user types something like _"I am sick, having fever"_, the agent:

1. **Identifies needs** — translates symptoms / intent into required items
2. **Matches catalog** — finds the closest products in the DummyJSON catalog
3. **Builds cart** — returns items the frontend should add via Redux

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

## Run the server (once we get to sub-step 1.5)

```bash
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

The API will be available at http://localhost:8000.

## Project layout

```
agent/
├── requirements.txt
├── .env                    (gitignored — your Gemini key)
├── .env.example            (committed)
└── app/
    ├── main.py             FastAPI app
    ├── graph.py            LangGraph state graph
    ├── models.py           Pydantic schemas (state, request, response)
    └── agents/
        └── needs_identifier.py   Subagent 1
```
