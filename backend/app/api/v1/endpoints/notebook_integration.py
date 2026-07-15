# ======================================================================
# Notebook Integration API Endpoints
# ======================================================================
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from ...models.crisis_event import CrisisEvent, CrisisEventCreate
from ...core.database import database
from ...services.crisis_processor import CrisisProcessor

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/sync")
async def sync_notebook_data(
    data: Dict[str, Any]
):
    """
    Receive crisis analysis data from Jupyter notebook
    
    This endpoint allows the notebook to send processed crisis events
    directly to the web app for immediate dashboard display
    """
    try:
        crisis_events = data.get('crisis_events', [])
        timestamp = data.get('timestamp', datetime.utcnow().isoformat())
        source = data.get('source', 'notebook')
        
        logger.info(f"📓 Received {len(crisis_events)} events from {source}")
        
        # Process and store events
        stored_events = []
        for event_data in crisis_events:
            try:
                # Convert notebook format to database format
                crisis_event = CrisisEventCreate(
                    crisis_type=event_data.get('crisis_type', 'other'),
                    severity=event_data.get('severity', 'low'),
                    confidence=float(event_data.get('confidence', 0.5)),
                    location_name=event_data.get('location_name'),
                    latitude=event_data.get('latitude'),
                    longitude=event_data.get('longitude'),
                    raw_text=event_data.get('raw_text', ''),
                    source_name=f"notebook_{event_data.get('source_name', 'analysis')}",
                    source_type='notebook',
                    trust_score=float(event_data.get('trust_score', 0.8)),
                    casualties=event_data.get('casualties'),
                    magnitude=event_data.get('magnitude'),
                    source_count=event_data.get('source_count', 1)
                )
                
                # Store in database with notebook flag
                query = """
                INSERT INTO crisis_events 
                (crisis_type, severity, confidence, location_name, latitude, longitude,
                 raw_text, source_name, source_type, trust_score, casualties, magnitude,
                 source_count, created_at, updated_at, notebook_session)
                VALUES 
                (:crisis_type, :severity, :confidence, :location_name, :latitude, :longitude,
                 :raw_text, :source_name, :source_type, :trust_score, :casualties, :magnitude,
                 :source_count, :created_at, :updated_at, :notebook_session)
                RETURNING id
                """
                
                values = crisis_event.dict()
                values.update({
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "notebook_session": timestamp
                })
                
                result = await database.fetch_one(query, values)
                if result:
                    stored_events.append(result['id'])
                    
            except Exception as e:
                logger.error(f"Failed to store event: {e}")
                continue
        
        logger.info(f"✅ Stored {len(stored_events)} notebook events")
        
        return {
            "status": "success",
            "events_received": len(crisis_events),
            "events_stored": len(stored_events),
            "timestamp": timestamp,
            "message": f"Notebook data synced successfully. {len(stored_events)} events now available in dashboards."
        }
        
    except Exception as e:
        logger.error(f"Notebook sync failed: {e}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

@router.get("/status")
async def get_notebook_integration_status():
    """
    Check if notebook integration is working
    """
    try:
        # Check recent notebook events
        query = """
        SELECT COUNT(*) as count, MAX(created_at) as last_sync
        FROM crisis_events 
        WHERE source_type = 'notebook' 
          AND created_at >= NOW() - INTERVAL '1 hour'
        """
        
        result = await database.fetch_one(query)
        
        return {
            "status": "operational",
            "recent_notebook_events": result['count'] if result else 0,
            "last_notebook_sync": result['last_sync'].isoformat() if result and result['last_sync'] else None,
            "webapp_ready": True,
            "integration_active": True
        }
        
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        return {
            "status": "error", 
            "error": str(e),
            "webapp_ready": False,
            "integration_active": False
        }

@router.get("/session/{session_id}/events")
async def get_session_events(
    session_id: str,
    limit: int = Query(50, ge=1, le=500)
):
    """
    Get crisis events for a specific notebook session
    
    This allows the web app to display only events from a particular
    notebook analysis run
    """
    try:
        query = """
        SELECT id, crisis_type, severity, confidence, location_name, latitude, longitude,
               raw_text, source_name, trust_score, casualties, magnitude,
               source_count, created_at
        FROM crisis_events 
        WHERE notebook_session = :session_id
        ORDER BY created_at DESC, confidence DESC
        LIMIT :limit
        """
        
        results = await database.fetch_all(query, {
            "session_id": session_id,
            "limit": limit
        })
        
        events = [dict(row) for row in results]
        
        return {
            "session_id": session_id,
            "events": events,
            "count": len(events),
            "retrieved_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Session events fetch failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch session events")

@router.post("/launch-dashboard")
async def launch_dashboard(
    role: str,
    session_id: Optional[str] = None,
    events: Optional[List[Dict]] = None
):
    """
    Prepare dashboard launch from notebook
    
    This endpoint can be called when notebook wants to launch a specific
    dashboard with current context
    """
    try:
        # Validate role
        valid_roles = ['citizen', 'tourist', 'responder', 'government', 'ngo', 'media', 'business']
        if role not in valid_roles:
            raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")
        
        # If events provided, sync them first
        if events:
            await sync_notebook_data({
                'crisis_events': events,
                'timestamp': session_id or datetime.utcnow().isoformat(),
                'source': 'notebook_launch'
            })
        
        # Generate dashboard URL with parameters
        base_url = "http://localhost:3000"  # This should be configurable
        dashboard_url = f"{base_url}/dashboard/{role}"
        
        # Add session parameters
        params = []
        if session_id:
            params.append(f"session={session_id}")
        params.append("source=notebook")
        params.append(f"launched_at={int(datetime.utcnow().timestamp())}")
        
        if params:
            dashboard_url += "?" + "&".join(params)
        
        return {
            "status": "ready",
            "role": role,
            "dashboard_url": dashboard_url,
            "session_id": session_id,
            "events_count": len(events) if events else 0,
            "message": f"{role.title()} dashboard ready for launch"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dashboard launch preparation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to prepare dashboard launch")

@router.get("/roles")
async def get_available_roles():
    """
    Get list of available dashboard roles with descriptions
    """
    roles = {
        "citizen": {
            "name": "👥 Citizen Dashboard",
            "description": "Personal safety guidance and local alerts",
            "color": "#2196F3",
            "primary_features": ["Safety alerts", "Nearby resources", "Emergency contacts", "Weather updates"]
        },
        "tourist": {
            "name": "✈️ Tourist Dashboard", 
            "description": "Travel safety and evacuation information",
            "color": "#FF9800",
            "primary_features": ["Travel advisories", "Airport status", "Embassy contacts", "Safe routes"]
        },
        "responder": {
            "name": "🚑 Emergency Responder Dashboard",
            "description": "Operational command and resource coordination",
            "color": "#F44336",
            "primary_features": ["Incident management", "Team coordination", "Resource tracking", "Communications"]
        },
        "government": {
            "name": "🏛️ Government Dashboard",
            "description": "Strategic overview and policy coordination",
            "color": "#9C27B0",
            "primary_features": ["Strategic overview", "Resource allocation", "Inter-agency coordination", "Policy decisions"]
        },
        "ngo": {
            "name": "🤝 NGO Dashboard",
            "description": "Humanitarian aid and volunteer coordination",
            "color": "#4CAF50",
            "primary_features": ["Aid distribution", "Volunteer coordination", "Supply management", "Beneficiary tracking"]
        },
        "media": {
            "name": "📰 Media Dashboard",
            "description": "Verified information and press resources",
            "color": "#607D8B",
            "primary_features": ["Verified reports", "Press releases", "Source verification", "Media resources"]
        },
        "business": {
            "name": "🏢 Business Dashboard",
            "description": "Continuity planning and impact assessment",
            "color": "#795548",
            "primary_features": ["Impact assessment", "Continuity planning", "Supply chain", "Economic analysis"]
        }
    }
    
    return {
        "roles": roles,
        "total_roles": len(roles),
        "integration_ready": True
    }

@router.delete("/session/{session_id}")
async def clear_session_data(session_id: str):
    """
    Clear data for a specific notebook session
    """
    try:
        query = """
        DELETE FROM crisis_events 
        WHERE notebook_session = :session_id
          AND source_type = 'notebook'
        """
        
        result = await database.execute(query, {"session_id": session_id})
        
        return {
            "status": "success",
            "session_id": session_id,
            "message": f"Session data cleared",
            "cleared_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Session clear failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear session data")