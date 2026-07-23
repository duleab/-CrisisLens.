from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Event
from app.schemas import EventOut, IngestResponse
from app.pipeline import fetch_usgs, fetch_bmkg, fetch_gdacs, fetch_newsapi, to_event_row

router = APIRouter(prefix="/api", tags=["events"])


@router.get("/events", response_model=list[EventOut])
async def list_events(
    db: AsyncSession = Depends(get_db),
    min_confidence: float = Query(0.0, ge=0.0, le=1.0),
    crisis_type: str | None = None,
    exclude_other: bool = True,
    limit: int = Query(200, le=500),
):
    stmt = select(Event).order_by(Event.system_confidence.desc()).limit(limit)
    result = await db.execute(stmt)
    events = result.scalars().all()

    filtered = [
        e for e in events
        if e.system_confidence >= min_confidence
        and (not exclude_other or e.crisis_type not in ("other", "unknown", ""))
        and (crisis_type is None or e.crisis_type == crisis_type)
    ]
    return filtered


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Returns KPI summary for the dashboard."""
    result = await db.execute(select(Event))
    events = result.scalars().all()

    by_type: dict[str, int] = {}
    for e in events:
        t = e.crisis_type or "other"
        by_type[t] = by_type.get(t, 0) + 1

    total = len(events)
    countries = len({e.country_iso for e in events if e.country_iso})
    avg_conf = sum(e.system_confidence for e in events) / total if total else 0

    return {
        "total": total,
        "critical": sum(1 for e in events if e.severity == "critical"),
        "high": sum(1 for e in events if e.severity == "high"),
        "medium": sum(1 for e in events if e.severity == "medium"),
        "low": sum(1 for e in events if e.severity == "low"),
        "verified": sum(1 for e in events if e.official_confirmed),
        "by_type": by_type,
        "countries": countries,
        "avg_confidence": round(avg_conf, 3),
    }


@router.post("/ingest", response_model=IngestResponse)
async def ingest(db: AsyncSession = Depends(get_db)):
    """Pulls live data from USGS + BMKG + NewsAPI right now and saves new events."""
    usgs_events = await fetch_usgs()
    bmkg_events = await fetch_bmkg()
    gdacs_events = await fetch_gdacs()
    news_events = await fetch_newsapi()
    all_raw = usgs_events + bmkg_events + gdacs_events + news_events

    existing_ids_stmt = select(Event.source_event_id)
    existing = {row[0] for row in (await db.execute(existing_ids_stmt)).all()}

    saved, skipped = 0, 0
    for raw in all_raw:
        if raw.get("source_event_id") in existing:
            skipped += 1
            continue
        db.add(to_event_row(raw))
        saved += 1

    await db.commit()
    return IngestResponse(fetched=len(all_raw), saved=saved, skipped_duplicates=skipped)
