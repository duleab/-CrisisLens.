from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from datetime import datetime, timedelta
from ....models.crisis_event import CrisisEvent, CrisisEventResponse
from ....core.database import database, crisis_events_table
from ....services.crisis_processor import CrisisProcessor
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

async def get_crisis_processor():
    """Dependency to get crisis processor"""
    return CrisisProcessor()

@router.get("/events", response_model=CrisisEventResponse)
async def get_crisis_events(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    crisis_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    min_confidence: float = Query(0.0, ge=0.0, le=1.0),
    hours_back: int = Query(24, ge=1, le=168),  # Max 1 week
    include_unverified: bool = Query(True)
):
    """Get crisis events with filtering and pagination"""
    
    try:
        # Build base query
        conditions = []
        params = {"limit": limit, "offset": offset}
        
        # Time filter
        time_threshold = datetime.utcnow() - timedelta(hours=hours_back)
        conditions.append("created_at >= :time_threshold")
        params["time_threshold"] = time_threshold
        
        # Confidence filter
        if min_confidence > 0:
            conditions.append("confidence >= :min_confidence")
            params["min_confidence"] = min_confidence
        
        # Crisis type filter
        if crisis_type:
            conditions.append("crisis_type = :crisis_type")
            params["crisis_type"] = crisis_type
        
        # Severity filter
        if severity:
            conditions.append("severity = :severity")
            params["severity"] = severity
        
        # Verification filter
        if not include_unverified:
            conditions.append("official_confirmed = true")
        
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        
        # Main query
        query = f"""
        SELECT * FROM crisis_events 
        WHERE {where_clause}
        ORDER BY confidence DESC, created_at DESC 
        LIMIT :limit OFFSET :offset
        """
        
        events = await database.fetch_all(query, params)
        
        # Count query
        count_query = f"""
        SELECT COUNT(*) as total FROM crisis_events 
        WHERE {where_clause}
        """
        
        total_result = await database.fetch_one(count_query, params)
        total_count = total_result["total"] if total_result else 0
        
        # Statistics queries
        stats_base = f"SELECT COUNT(*) as count FROM crisis_events WHERE {where_clause}"
        
        high_conf_params = {**params, "high_conf_threshold": 0.8}
        high_conf_query = f"{stats_base} AND confidence >= :high_conf_threshold"
        high_conf_result = await database.fetch_one(high_conf_query, high_conf_params)
        high_confidence_count = high_conf_result["count"] if high_conf_result else 0
        
        verified_query = f"{stats_base} AND official_confirmed = true"
        verified_result = await database.fetch_one(verified_query, params)
        verified_count = verified_result["count"] if verified_result else 0
        
        # Group by statistics
        by_type_query = f"""
        SELECT crisis_type, COUNT(*) as count 
        FROM crisis_events 
        WHERE {where_clause} 
        GROUP BY crisis_type
        """
        by_type_results = await database.fetch_all(by_type_query, params)
        by_type = {row["crisis_type"]: row["count"] for row in by_type_results}
        
        by_severity_query = f"""
        SELECT severity, COUNT(*) as count 
        FROM crisis_events 
        WHERE {where_clause} 
        GROUP BY severity
        """
        by_severity_results = await database.fetch_all(by_severity_query, params)
        by_severity = {row["severity"]: row["count"] for row in by_severity_results}
        
        by_country_query = f"""
        SELECT country_iso, COUNT(*) as count 
        FROM crisis_events 
        WHERE {where_clause} AND country_iso IS NOT NULL 
        GROUP BY country_iso
        """
        by_country_results = await database.fetch_all(by_country_query, params)
        by_country = {row["country_iso"]: row["count"] for row in by_country_results}
        
        return CrisisEventResponse(
            events=[CrisisEvent(**dict(event)) for event in events],
            total_count=total_count,
            high_confidence_count=high_confidence_count,
            verified_count=verified_count,
            by_type=by_type,
            by_severity=by_severity,
            by_country=by_country
        )
        
    except Exception as e:
        logger.error(f"Error fetching crisis events: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/events/{event_id}", response_model=CrisisEvent)
async def get_crisis_event(event_id: int):
    """Get specific crisis event by ID"""
    
    query = "SELECT * FROM crisis_events WHERE id = :event_id"
    event = await database.fetch_one(query, {"event_id": event_id})
    
    if not event:
        raise HTTPException(status_code=404, detail="Crisis event not found")
    
    return CrisisEvent(**dict(event))

@router.get("/events/near/{latitude}/{longitude}")
async def get_events_near_location(
    latitude: float,
    longitude: float,
    radius_km: float = Query(100, ge=1, le=1000),
    limit: int = Query(20, ge=1, le=100)
):
    """Get crisis events near a specific location"""
    
    # Simple distance calculation (can be improved with PostGIS)
    query = """
    SELECT *, 
           (6371 * acos(cos(radians(:lat)) * cos(radians(latitude)) * 
           cos(radians(longitude) - radians(:lon)) + sin(radians(:lat)) * 
           sin(radians(latitude)))) AS distance_km
    FROM crisis_events 
    WHERE latitude IS NOT NULL 
      AND longitude IS NOT NULL
      AND created_at >= NOW() - INTERVAL '7 days'
    HAVING distance_km <= :radius_km
    ORDER BY distance_km ASC, confidence DESC
    LIMIT :limit
    """
    
    try:
        events = await database.fetch_all(query, {
            "lat": latitude,
            "lon": longitude, 
            "radius_km": radius_km,
            "limit": limit
        })
        
        return [
            {
                **dict(event),
                "distance_km": round(event["distance_km"], 2)
            }
            for event in events
        ]
        
    except Exception as e:
        logger.error(f"Error fetching nearby events: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/collect")
async def trigger_collection(processor: CrisisProcessor = Depends(get_crisis_processor)):
    """Manually trigger crisis data collection"""
    
    try:
        new_events = await processor.collect_and_process()
        
        return {
            "success": True,
            "message": f"Collection completed",
            "new_events_count": len(new_events),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Manual collection error: {e}")
        raise HTTPException(status_code=500, detail="Collection failed")

@router.get("/stats")
async def get_crisis_stats():
    """Get overall crisis statistics"""
    
    try:
        # Total events in last 24 hours
        query_24h = """
        SELECT 
            COUNT(*) as total_24h,
            COUNT(CASE WHEN confidence >= 0.8 THEN 1 END) as high_conf_24h,
            COUNT(CASE WHEN official_confirmed = true THEN 1 END) as verified_24h,
            AVG(confidence) as avg_confidence
        FROM crisis_events 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        """
        
        stats_24h = await database.fetch_one(query_24h)
        
        # By crisis type (last 7 days)
        type_query = """
        SELECT crisis_type, COUNT(*) as count
        FROM crisis_events 
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY crisis_type
        ORDER BY count DESC
        """
        
        type_stats = await database.fetch_all(type_query)
        
        # By country (last 7 days)
        country_query = """
        SELECT country_iso, COUNT(*) as count
        FROM crisis_events 
        WHERE created_at >= NOW() - INTERVAL '7 days'
          AND country_iso IS NOT NULL
        GROUP BY country_iso
        ORDER BY count DESC
        LIMIT 10
        """
        
        country_stats = await database.fetch_all(country_query)
        
        return {
            "last_24_hours": {
                "total_events": stats_24h["total_24h"] if stats_24h else 0,
                "high_confidence": stats_24h["high_conf_24h"] if stats_24h else 0,
                "verified": stats_24h["verified_24h"] if stats_24h else 0,
                "average_confidence": round(stats_24h["avg_confidence"] or 0, 2)
            },
            "by_type": [
                {"type": row["crisis_type"], "count": row["count"]} 
                for row in type_stats
            ],
            "by_country": [
                {"country": row["country_iso"], "count": row["count"]} 
                for row in country_stats
            ],
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching crisis stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")