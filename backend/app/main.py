from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.config import settings
from app.db import init_db, AsyncSessionLocal
from app.routers import events, chat
from app.pipeline import fetch_usgs, fetch_bmkg, fetch_gdacs, fetch_newsapi, to_event_row
from sqlalchemy import select
from app.models import Event

scheduler = AsyncIOScheduler()


async def scheduled_ingest():
    """Runs automatically every settings.ingest_interval_minutes.
    Fetches from USGS + BMKG + NewsAPI and saves new events."""
    async with AsyncSessionLocal() as db:
        usgs_events = await fetch_usgs()
        bmkg_events = await fetch_bmkg()
        gdacs_events = await fetch_gdacs()
        news_events = await fetch_newsapi()
        all_raw = usgs_events + bmkg_events + gdacs_events + news_events

        existing = {row[0] for row in (await db.execute(select(Event.source_event_id))).all()}
        saved = 0
        for raw in all_raw:
            if raw.get("source_event_id") in existing:
                continue
            db.add(to_event_row(raw))
            saved += 1
        await db.commit()
        print(f"[scheduled_ingest] fetched={len(all_raw)} saved={saved} "
              f"(usgs={len(usgs_events)} bmkg={len(bmkg_events)} gdacs={len(gdacs_events)} news={len(news_events)})")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await scheduled_ingest()
    scheduler.add_job(
        scheduled_ingest, "interval",
        minutes=settings.ingest_interval_minutes,
    )
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title="CrisisLens API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events.router)
app.include_router(chat.router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "ai_configured": bool(settings.google_api_key),
        "newsapi_configured": bool(settings.newsapi_key),
    }
