import asyncio
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Event
from app.schemas import EventOut, IngestResponse
from app.pipeline import (
    fetch_usgs, fetch_bmkg, fetch_gdacs, fetch_eonet,
    fetch_open_meteo, fetch_who_rss, fetch_newsapi, to_event_row
)
from app.config import settings

router = APIRouter(prefix="/api", tags=["events"])

SEA_COUNTRIES = {"ID", "PH", "MY", "TH", "VN", "MM", "KH", "LA", "BN", "TL", "SG"}


def _is_in_region(event: Event, region: str) -> bool:
    if region == "world":
        return True
    # SEA check: country in SEA set OR coords inside bounding box
    if event.country_iso and event.country_iso.upper() in SEA_COUNTRIES:
        return True
    if event.latitude is not None and event.longitude is not None:
        min_lat, max_lat = settings.region_bbox["min_lat"], settings.region_bbox["max_lat"]
        min_lon, max_lon = settings.region_bbox["min_lon"], settings.region_bbox["max_lon"]
        if min_lat <= event.latitude <= max_lat and min_lon <= event.longitude <= max_lon:
            return True
    return False


@router.get("/events", response_model=list[EventOut])
async def get_events(
    db: AsyncSession = Depends(get_db),
    crisis_type: str | None = Query(None),
    severity: str | None = Query(None),
    limit: int = Query(200, ge=1, le=500),
    region: str = Query("sea"),
):
    stmt = select(Event).order_by(Event.event_date.desc().nulls_last(), Event.id.desc()).limit(limit * 2)
    if crisis_type:
        stmt = stmt.where(Event.crisis_type == crisis_type)
    if severity:
        stmt = stmt.where(Event.severity == severity)

    rows = (await db.execute(stmt)).scalars().all()
    filtered = [r for r in rows if _is_in_region(r, region)][:limit]
    return filtered


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    region: str = Query("sea"),
):
    rows = (await db.execute(select(Event))).scalars().all()
    filtered = [r for r in rows if _is_in_region(r, region)]
    total = len(filtered)
    if total == 0:
        return {"total": 0, "critical": 0, "high": 0, "medium": 0, "low": 0, "by_type": {}, "avg_confidence": 0}

    by_type: dict[str, int] = {}
    sev = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    conf_sum = 0.0

    for r in filtered:
        by_type[r.crisis_type] = by_type.get(r.crisis_type, 0) + 1
        sev[r.severity] = sev.get(r.severity, 0) + 1
        conf_sum += r.system_confidence

    avg_conf = conf_sum / total if total > 0 else 0
    return {
        "total": total,
        "critical": sev["critical"],
        "high": sev["high"],
        "medium": sev["medium"],
        "low": sev["low"],
        "by_type": by_type,
        "avg_confidence": round(avg_conf, 3),
    }


@router.post("/ingest", response_model=IngestResponse)
async def ingest(db: AsyncSession = Depends(get_db)):
    """Pulls live data from all 7 sources concurrently right now and saves new events."""
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
