from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from ....models.crisis_event import ChatResponse, ChatMessage
from ....services.ai_chat import AIChatService
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    user_role: str = "citizen"
    session_id: Optional[str] = None
    user_location: Optional[str] = None

class SessionRequest(BaseModel):
    user_role: str = "citizen"
    user_location: Optional[str] = None

async def get_chat_service():
    """Dependency to get chat service"""
    return AIChatService()

@router.post("/message", response_model=ChatResponse)
async def send_chat_message(
    request: ChatRequest,
    chat_service: AIChatService = Depends(get_chat_service)
):
    """Send a chat message and get AI response"""
    
    try:
        # Generate session ID if not provided
        if not request.session_id:
            request.session_id = str(uuid.uuid4())
        
        # Process message
        response = await chat_service.process_message(
            message=request.message,
            user_role=request.user_role,
            session_id=request.session_id,
            user_location=request.user_location
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Chat message error: {e}")
        raise HTTPException(status_code=500, detail="Chat processing failed")

@router.post("/session")
async def create_chat_session(request: SessionRequest):
    """Create a new chat session"""
    
    session_id = str(uuid.uuid4())
    
    return {
        "session_id": session_id,
        "user_role": request.user_role,
        "user_location": request.user_location,
        "created_at": None
    }

@router.get("/session/{session_id}/history")
async def get_chat_history(
    session_id: str,
    limit: int = 50,
    chat_service: AIChatService = Depends(get_chat_service)
):
    """Get chat history for a session"""
    
    try:
        history = await chat_service.get_chat_history(session_id, limit)
        return {
            "session_id": session_id,
            "messages": history
        }
        
    except Exception as e:
        logger.error(f"Error fetching chat history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch chat history")

@router.get("/suggestions/{user_role}")
async def get_suggested_questions(
    user_role: str,
    chat_service: AIChatService = Depends(get_chat_service)
):
    """Get suggested questions for a user role"""
    
    if user_role not in ["citizen", "government", "responder", "tourist"]:
        raise HTTPException(status_code=400, detail="Invalid user role")
    
    suggestions = chat_service.get_suggested_questions(user_role)
    
    return {
        "user_role": user_role,
        "suggestions": suggestions
    }

@router.get("/roles")
async def get_available_roles():
    """Get available user roles and their descriptions"""
    
    roles = {
        "citizen": {
            "name": "👥 Citizen",
            "description": "Personal safety and family protection guidance",
            "focus_areas": ["Personal safety", "Evacuation advice", "Emergency contacts", "Family protection"]
        },
        "government": {
            "name": "🏛️ Government Official", 
            "description": "Strategic decisions and resource coordination",
            "focus_areas": ["Resource allocation", "Policy decisions", "Coordination", "Situation assessment"]
        },
        "responder": {
            "name": "🚑 Emergency Responder",
            "description": "Tactical operations and rescue coordination", 
            "focus_areas": ["Rescue operations", "Tactical decisions", "Resource deployment", "Team coordination"]
        },
        "tourist": {
            "name": "✈️ Tourist",
            "description": "Travel safety and destination guidance",
            "focus_areas": ["Travel safety", "Destination info", "Embassy contacts", "Transportation"]
        }
    }
    
    return {"roles": roles}

@router.delete("/session/{session_id}")
async def delete_chat_session(session_id: str):
    """Delete a chat session and its history"""
    
    try:
        # In a real implementation, you would delete from database
        # For now, just return success
        return {
            "success": True,
            "message": f"Session {session_id} deleted",
            "session_id": session_id
        }
        
    except Exception as e:
        logger.error(f"Error deleting chat session: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete session")