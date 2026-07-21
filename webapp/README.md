# CrisisLens Webapp — MVP

A real, standalone version of your Kaggle pipeline: FastAPI backend pulling
**live** data from USGS + BMKG (both public, no API key needed), Postgres
storage, Gemma-powered chat moved server-side, and a React dashboard.

## What's real vs. what's a starting point

**Verified working:**
- Backend imports cleanly, all routes wire up correctly (`app.main` tested directly)
- USGS and BMKG endpoint URLs confirmed live and current via search
- Confidence-scoring formula is an exact port of your notebook's Cell 8 logic
- Gemma prompts/role instructions are an exact port of `crisislens_dashboard.py`

**Not yet tested end-to-end:**
- I couldn't run `npm install` to completion in my sandbox (registry access
  kept timing out — a sandbox limitation, not a code issue). Run
  `npm install && npx tsc --noEmit` yourself as your first step; the code
  follows completely standard React+TypeScript+Vite patterns, but I want to
  be upfront that I haven't watched it compile clean myself.
- Never connected to a real Postgres instance or made a live call to
  USGS/BMKG (both domains aren't reachable from my sandbox network).

## Quick start

1. Copy `.env.example` to `.env` and fill in `GOOGLE_API_KEY` at minimum.
2. `docker compose up --build`
3. Backend: http://localhost:8000/docs (FastAPI's auto-generated API explorer —
   good first stop to confirm it's alive)
4. Frontend: http://localhost:5173
5. Click "Fetch Live Data" in the UI (or `curl -X POST localhost:8000/api/ingest`)
   to pull real events from USGS + BMKG for the first time.

## Local dev without Docker

```bash
# Backend
cd backend
pip install -r requirements.txt
# needs a real Postgres running — easiest: docker run -p 5432:5432 -e POSTGRES_PASSWORD=changeme postgres:16
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## What's deliberately NOT built yet (by design, for MVP speed)

- Only USGS + BMKG are wired up — NewsAPI/RSS ingestion (which needs the
  Gemma extraction pass, unlike these two structured sources) isn't ported
  yet. `app/gemma.py` already has `classify_report()` ready for this — the
  next step is writing an `ingest_news()` function in `pipeline.py` that
  calls it.
- No SBERT deduplication yet — USGS and BMKG sometimes report the same
  quake independently, so you may see near-duplicate markers. Cell 7's
  dedup logic hasn't been ported to `pipeline.py` yet.
- Only one dashboard view (not the 4 role-based tabs from `dashboard.html`)
  — `ChatPanel.tsx`'s role dropdown already changes the AI's tone, but the
  surrounding UI doesn't change layout per role yet.
- No WebSocket live updates — the frontend fetches once on load; hit
  "Fetch Live Data" to refresh manually.
