from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.config import settings
from app.db import init_db, AsyncSessionLocal
from app.routers import events, chat
from app.pipeline import (
    fetch_usgs, fetch_bmkg, fetch_gdacs, fetch_eonet,
    fetch_open_meteo, fetch_who_rss, fetch_newsapi, to_event_row
)
from sqlalchemy import select
import asyncio
from app.models import Event

scheduler = AsyncIOScheduler()


async def scheduled_ingest():
    """Runs automatically every settings.ingest_interval_minutes.
    Fetches from all 7 live sources concurrently and saves new events."""
    async with AsyncSessionLocal() as db:
        results = await asyncio.gather(
            fetch_usgs(),
            fetch_bmkg(),
            fetch_gdacs(),
            fetch_eonet(),
            fetch_open_meteo(),
            fetch_who_rss(),
            fetch_newsapi(),
            return_exceptions=True
        )
        usgs_events = results[0] if isinstance(results[0], list) else []
        bmkg_events = results[1] if isinstance(results[1], list) else []
        gdacs_events = results[2] if isinstance(results[2], list) else []
        eonet_events = results[3] if isinstance(results[3], list) else []
        meteo_events = results[4] if isinstance(results[4], list) else []
        who_events = results[5] if isinstance(results[5], list) else []
        news_events = results[6] if isinstance(results[6], list) else []

        all_raw = (
            usgs_events + bmkg_events + gdacs_events + eonet_events +
            meteo_events + who_events + news_events
        )

        existing = {row[0] for row in (await db.execute(select(Event.source_event_id))).all()}
        saved = 0
        for raw in all_raw:
            if raw.get("source_event_id") in existing:
                continue
            db.add(to_event_row(raw))
            saved += 1
        await db.commit()
        print(f"[scheduled_ingest] fetched={len(all_raw)} saved={saved} "
              f"(usgs={len(usgs_events)} bmkg={len(bmkg_events)} gdacs={len(gdacs_events)} eonet={len(eonet_events)} meteo={len(meteo_events)} who={len(who_events)} news={len(news_events)})")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Run initial ingest in background so Uvicorn starts accepting requests immediately
    asyncio.create_task(scheduled_ingest())
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
