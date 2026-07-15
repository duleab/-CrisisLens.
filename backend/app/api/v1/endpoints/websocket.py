from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Dict, Optional
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# This endpoint is handled directly in main.py, but we include it here for consistency
# The actual WebSocket connection is at /ws/{client_id} in main.py

class WebSocketMessage(BaseModel):
    type: str
    content: Optional[str] = None
    role: Optional[str] = None
    location: Optional[str] = None

@router.get("/connection-info")
async def get_websocket_info():
    """Get WebSocket connection information"""
    return {
        "websocket_url": "/ws/{client_id}",
        "supported_message_types": [
            "chat",
            "role_update", 
            "location_update",
            "ping"
        ],
        "roles": ["citizen", "government", "responder", "tourist"],
        "example_connection": "ws://localhost:8000/ws/your-unique-client-id"
    }

@router.get("/stats")
async def get_websocket_stats():
    """Get WebSocket connection statistics"""
    # This would typically access the WebSocketManager from main.py
    # For now, return placeholder data
    return {
        "total_connections": 0,
        "connections_by_role": {
            "citizen": 0,
            "government": 0, 
            "responder": 0,
            "tourist": 0
        },
        "message": "WebSocket stats are managed by the main WebSocket endpoint"
    }