from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db import get_db
from app.models import Event

router = APIRouter()

@router.get("/api/analytics/summary")
async def analytics_summary(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Event))
    events = result.scalars().all()

    by_type = {}
    by_severity = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    events_per_day = {}
    
    total_casualties = 0
    total_confidence = 0.0
    verified_count = 0

    now = datetime.now(timezone.utc)
    
    # Initialize last 14 days with 0
    for i in range(13, -1, -1):
        d = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        events_per_day[d] = 0

    for e in events:
        # By Type
        by_type[e.crisis_type] = by_type.get(e.crisis_type, 0) + 1
        
        # By Severity
        sev = e.severity.lower()
        if sev in by_severity:
            by_severity[sev] += 1
        else:
            by_severity[sev] = 1

        # Sum Casualties
        if e.casualties_estimated:
            total_casualties += e.casualties_estimated
            
        # Confidence
        total_confidence += e.system_confidence
        
        # Verified
        if e.official_confirmed:
            verified_count += 1
            
        # Events Per Day
        # Try to parse event_date or use created_at
        d_str = None
        if e.event_date:
            try:
                # Assuming ISO format like "2024-01-01T12:00:00Z"
                d_str = e.event_date[:10]
            except:
                pass
        
        if not d_str and e.created_at:
            d_str = e.created_at.strftime("%Y-%m-%d")
            
        if d_str and d_str in events_per_day:
            events_per_day[d_str] += 1

    total = len(events)
    avg_confidence = (total_confidence / total) if total > 0 else 0.0

    return {
        "total_events": total,
        "by_type": by_type,
        "by_severity": by_severity,
        "events_per_day": [{"date": k, "count": v} for k, v in events_per_day.items()],
        "total_casualties": total_casualties,
        "avg_confidence": avg_confidence,
        "verified_count": verified_count,
        "unverified_count": total - verified_count,
    }
