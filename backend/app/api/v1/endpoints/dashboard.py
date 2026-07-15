from fastapi import APIRouter, HTTPException, Query
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from ....core.database import database
from ....services.ai_chat import AIChatService
from ....utils.ai_client import get_gemma_client
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/summary")
async def get_dashboard_summary(role: str = Query("government")):
    """Get dashboard summary data optimized for specific role"""
    
    try:
        # Get recent events (last 24 hours)
        recent_query = """
        SELECT crisis_type, severity, confidence, location_name, country_iso,
               latitude, longitude, magnitude, casualties, official_confirmed,
               created_at, source_name
        FROM crisis_events 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY confidence DESC, created_at DESC
        LIMIT 50
        """
        
        recent_events = await database.fetch_all(recent_query)
        
        # Get key statistics
        stats_query = """
        SELECT 
            COUNT(*) as total_events,
            COUNT(CASE WHEN confidence >= 0.8 THEN 1 END) as high_confidence,
            COUNT(CASE WHEN official_confirmed = true THEN 1 END) as verified,
            COUNT(CASE WHEN severity IN ('high', 'critical') THEN 1 END) as critical_events,
            AVG(confidence) as avg_confidence,
            COUNT(DISTINCT country_iso) as countries_affected
        FROM crisis_events 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        """
        
        stats = await database.fetch_one(stats_query)
        
        # Get geographic distribution
        geo_query = """
        SELECT country_iso, COUNT(*) as count,
               AVG(confidence) as avg_confidence
        FROM crisis_events 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
          AND country_iso IS NOT NULL
        GROUP BY country_iso
        ORDER BY count DESC
        LIMIT 10
        """
        
        geo_distribution = await database.fetch_all(geo_query)
        
        # Get crisis type distribution
        type_query = """
        SELECT crisis_type, COUNT(*) as count,
               AVG(confidence) as avg_confidence,
               MAX(CASE WHEN severity IN ('high', 'critical') THEN 1 ELSE 0 END) as has_critical
        FROM crisis_events 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY crisis_type
        ORDER BY count DESC
        """
        
        type_distribution = await database.fetch_all(type_query)
        
        # Generate AI summary based on role
        ai_summary = await _generate_role_summary(recent_events, role)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "role": role,
            "statistics": {
                "total_events": stats["total_events"] if stats else 0,
                "high_confidence": stats["high_confidence"] if stats else 0,
                "verified": stats["verified"] if stats else 0,
                "critical_events": stats["critical_events"] if stats else 0,
                "average_confidence": round(stats["avg_confidence"] or 0, 2),
                "countries_affected": stats["countries_affected"] if stats else 0
            },
            "geographic_distribution": [
                {
                    "country": row["country_iso"],
                    "event_count": row["count"],
                    "avg_confidence": round(row["avg_confidence"], 2)
                }
                for row in geo_distribution
            ],
            "crisis_types": [
                {
                    "type": row["crisis_type"],
                    "count": row["count"],
                    "avg_confidence": round(row["avg_confidence"], 2),
                    "has_critical": bool(row["has_critical"])
                }
                for row in type_distribution
            ],
            "recent_events": [
                {
                    "id": i + 1,
                    "type": event["crisis_type"],
                    "location": event["location_name"],
                    "country": event["country_iso"],
                    "severity": event["severity"],
                    "confidence": round(event["confidence"], 2),
                    "verified": event["official_confirmed"],
                    "timestamp": event["created_at"].isoformat() if event["created_at"] else None,
                    "source": event["source_name"],
                    "coordinates": [event["latitude"], event["longitude"]] if event["latitude"] and event["longitude"] else None
                }
                for i, event in enumerate(recent_events[:20])
            ],
            "ai_summary": ai_summary
        }
        
    except Exception as e:
        logger.error(f"Dashboard summary error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate dashboard summary")

@router.get("/map-data")
async def get_map_data(hours_back: int = Query(24, ge=1, le=168)):
    """Get crisis events formatted for map display"""
    
    try:
        query = """
        SELECT crisis_type, severity, confidence, location_name, country_iso,
               latitude, longitude, magnitude, casualties, official_confirmed,
               created_at, raw_text, source_name
        FROM crisis_events 
        WHERE created_at >= NOW() - INTERVAL :hours_back HOUR
          AND latitude IS NOT NULL 
          AND longitude IS NOT NULL
        ORDER BY confidence DESC, created_at DESC
        LIMIT 200
        """
        
        events = await database.fetch_all(query, {"hours_back": hours_back})
        
        map_events = []
        for event in events:
            # Determine marker color based on severity and confidence
            color = _get_marker_color(event["severity"], event["confidence"])
            
            map_events.append({
                "id": hash(f"{event['latitude']}{event['longitude']}{event['created_at']}"),
                "coordinates": [float(event["latitude"]), float(event["longitude"])],
                "type": event["crisis_type"],
                "severity": event["severity"],
                "confidence": round(event["confidence"], 2),
                "location": event["location_name"],
                "country": event["country_iso"],
                "verified": event["official_confirmed"],
                "timestamp": event["created_at"].isoformat() if event["created_at"] else None,
                "source": event["source_name"],
                "marker_color": color,
                "popup_data": {
                    "title": f"{event['crisis_type'].title()} - {event['location_name']}",
                    "description": event["raw_text"][:200] + "..." if event["raw_text"] else "",
                    "magnitude": event["magnitude"],
                    "casualties": event["casualties"],
                    "confidence_level": _get_confidence_level(event["confidence"])
                }
            })
        
        return {
            "events": map_events,
            "bounds": _calculate_bounds([e["coordinates"] for e in map_events]) if map_events else None,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Map data error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate map data")

@router.get("/alerts")
async def get_crisis_alerts(
    role: str = Query("government"),
    severity: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50)
):
    """Get crisis alerts tailored for specific role"""
    
    try:
        conditions = ["created_at >= NOW() - INTERVAL '6 hours'"]
        params = {"limit": limit}
        
        if severity:
            conditions.append("severity = :severity")
            params["severity"] = severity
        
        where_clause = " AND ".join(conditions)
        
        query = f"""
        SELECT crisis_type, severity, confidence, location_name, country_iso,
               created_at, source_name, official_confirmed, magnitude, casualties
        FROM crisis_events 
        WHERE {where_clause}
        ORDER BY 
            CASE severity 
                WHEN 'critical' THEN 4 
                WHEN 'high' THEN 3 
                WHEN 'medium' THEN 2 
                ELSE 1 
            END DESC,
            confidence DESC,
            created_at DESC
        LIMIT :limit
        """
        
        alerts = await database.fetch_all(query, params)
        
        formatted_alerts = []
        for alert in alerts:
            # Generate role-specific alert message
            message = _generate_alert_message(alert, role)
            
            formatted_alerts.append({
                "id": hash(f"{alert['location_name']}{alert['created_at']}"),
                "type": alert["crisis_type"],
                "severity": alert["severity"],
                "location": alert["location_name"],
                "country": alert["country_iso"],
                "confidence": round(alert["confidence"], 2),
                "verified": alert["official_confirmed"],
                "timestamp": alert["created_at"].isoformat() if alert["created_at"] else None,
                "message": message,
                "source": alert["source_name"],
                "priority": _calculate_priority(alert["severity"], alert["confidence"]),
                "details": {
                    "magnitude": alert["magnitude"],
                    "casualties": alert["casualties"]
                }
            })
        
        return {
            "alerts": formatted_alerts,
            "role": role,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Alerts error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate alerts")

@router.get("/analytics")
async def get_analytics_data(days_back: int = Query(7, ge=1, le=30)):
    """Get analytics data for charts and trends"""
    
    try:
        # Time series data (events per day)
        timeseries_query = """
        SELECT DATE(created_at) as date, 
               COUNT(*) as total_events,
               COUNT(CASE WHEN confidence >= 0.8 THEN 1 END) as high_conf_events,
               COUNT(CASE WHEN official_confirmed = true THEN 1 END) as verified_events
        FROM crisis_events 
        WHERE created_at >= NOW() - INTERVAL :days_back DAY
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        """
        
        timeseries = await database.fetch_all(timeseries_query, {"days_back": days_back})
        
        # Severity trends
        severity_query = """
        SELECT severity, COUNT(*) as count
        FROM crisis_events 
        WHERE created_at >= NOW() - INTERVAL :days_back DAY
        GROUP BY severity
        ORDER BY 
            CASE severity 
                WHEN 'critical' THEN 4 
                WHEN 'high' THEN 3 
                WHEN 'medium' THEN 2 
                ELSE 1 
            END DESC
        """
        
        severity_data = await database.fetch_all(severity_query, {"days_back": days_back})
        
        # Source reliability analysis
        source_query = """
        SELECT source_name, 
               COUNT(*) as total_reports,
               AVG(confidence) as avg_confidence,
               COUNT(CASE WHEN official_confirmed = true THEN 1 END) as verified_reports
        FROM crisis_events 
        WHERE created_at >= NOW() - INTERVAL :days_back DAY
        GROUP BY source_name
        HAVING COUNT(*) >= 3
        ORDER BY avg_confidence DESC, total_reports DESC
        """
        
        source_analysis = await database.fetch_all(source_query, {"days_back": days_back})
        
        return {
            "time_range": f"Last {days_back} days",
            "timeseries": [
                {
                    "date": row["date"].isoformat() if row["date"] else None,
                    "total_events": row["total_events"],
                    "high_confidence": row["high_conf_events"],
                    "verified": row["verified_events"]
                }
                for row in timeseries
            ],
            "severity_distribution": [
                {
                    "severity": row["severity"],
                    "count": row["count"]
                }
                for row in severity_data
            ],
            "source_analysis": [
                {
                    "source": row["source_name"],
                    "total_reports": row["total_reports"],
                    "avg_confidence": round(row["avg_confidence"], 2),
                    "verified_reports": row["verified_reports"],
                    "verification_rate": round(row["verified_reports"] / row["total_reports"] * 100, 1)
                }
                for row in source_analysis
            ],
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Analytics error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate analytics")

# Helper functions

async def _generate_role_summary(events: List, role: str) -> str:
    """Generate AI summary tailored for specific role"""
    
    if not events:
        return "No significant crisis events detected in the last 24 hours."
    
    # Build context from top events
    context_lines = []
    for event in events[:10]:
        context_lines.append(
            f"- {event['crisis_type']} in {event['location_name']} "
            f"({event['severity']} severity, {event['confidence']:.0%} confidence)"
        )
    
    context = "\n".join(context_lines)
    
    role_prompts = {
        "citizen": "Provide a brief safety-focused summary for citizens about current crisis situation.",
        "government": "Provide a strategic overview for government officials focusing on coordination needs.",
        "responder": "Provide tactical summary for emergency responders highlighting operational priorities.",
        "tourist": "Provide travel safety summary for tourists about current regional conditions."
    }
    
    prompt = f"""{role_prompts.get(role, role_prompts['government'])}

Current crisis events:
{context}

Provide 2-3 sentences summary focusing on the most critical information for this role."""

    try:
        client = get_gemma_client()
        return await client.generate_content(prompt, temperature=0.3, max_tokens=200)
    except Exception:
        return "Current situation monitoring active. Multiple crisis events detected requiring attention."

def _get_marker_color(severity: str, confidence: float) -> str:
    """Get marker color based on severity and confidence"""
    if severity in ['critical', 'high'] and confidence >= 0.8:
        return 'red'
    elif severity == 'high' or confidence >= 0.8:
        return 'orange'
    elif severity == 'medium' or confidence >= 0.6:
        return 'yellow'
    else:
        return 'blue'

def _get_confidence_level(confidence: float) -> str:
    """Convert confidence score to text level"""
    if confidence >= 0.9:
        return 'Very High'
    elif confidence >= 0.8:
        return 'High'
    elif confidence >= 0.6:
        return 'Medium'
    else:
        return 'Low'

def _calculate_bounds(coordinates: List[List[float]]) -> Dict:
    """Calculate map bounds from coordinates"""
    if not coordinates:
        return None
    
    lats = [coord[0] for coord in coordinates]
    lngs = [coord[1] for coord in coordinates]
    
    return {
        "north": max(lats),
        "south": min(lats),
        "east": max(lngs),
        "west": min(lngs)
    }

def _generate_alert_message(alert: Dict, role: str) -> str:
    """Generate role-specific alert message"""
    
    base_msg = f"{alert['crisis_type'].title()} detected in {alert['location_name']}"
    
    if role == "citizen":
        return f"🚨 {base_msg}. Check safety guidelines and emergency contacts."
    elif role == "government":
        return f"📊 {base_msg}. Coordinate response and resource allocation."
    elif role == "responder":
        return f"🚑 {base_msg}. Deploy teams and assess operational needs."
    elif role == "tourist":
        return f"✈️ {base_msg}. Review travel plans and contact embassy if needed."
    
    return base_msg

def _calculate_priority(severity: str, confidence: float) -> int:
    """Calculate alert priority (1-5, 5 being highest)"""
    severity_score = {
        'critical': 4,
        'high': 3,
        'medium': 2,
        'low': 1
    }.get(severity, 1)
    
    confidence_bonus = 1 if confidence >= 0.8 else 0
    
    return min(5, severity_score + confidence_bonus)