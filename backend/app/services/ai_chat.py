from datetime import datetime
from typing import List, Dict, Optional
from ..models.crisis_event import ChatResponse, CrisisEvent
from ..core.database import database, crisis_events_table, chat_history_table
from ..utils.ai_client import get_gemma_client
import logging

logger = logging.getLogger(__name__)

class AIChatService:
    """AI Chat service for role-based crisis assistance"""
    
    def __init__(self):
        self.client = get_gemma_client()
        
        # Role-specific instructions matching your implementation
        self.role_instructions = {
            "citizen": (
                "You are CrisisLens AI helping a CITIZEN with safety questions. "
                "Focus on personal safety, evacuation advice, emergency contacts, and family protection. "
                "Be caring and protective. Provide actionable safety guidance."
            ),
            "government": (
                "You are CrisisLens AI helping a GOVERNMENT OFFICIAL with strategic decisions. "
                "Focus on resource allocation, coordination needs, policy decisions, and situation assessments. "
                "Be analytical and strategic. Provide data-driven insights."
            ),
            "responder": (
                "You are CrisisLens AI helping an EMERGENCY RESPONDER with tactical decisions. "
                "Focus on operational priorities, resource deployment, rescue operations, and tactical guidance. "
                "Be decisive and tactical. Provide clear operational recommendations."
            ),
            "tourist": (
                "You are CrisisLens AI helping a TOURIST with travel safety. "
                "Focus on travel advisories, destination safety, transportation, and embassy contacts. "
                "Be informative and helpful. Provide travel-specific guidance."
            )
        }
    
    async def process_message(self, message: str, user_role: str, session_id: str, 
                            user_location: Optional[str] = None) -> ChatResponse:
        """Process chat message and generate AI response"""
        
        try:
            # Get current crisis context
            context = await self._build_crisis_context()
            
            # Generate AI response
            response_text = await self._generate_response(
                message, user_role, context, user_location
            )
            
            # Save chat history
            await self._save_chat_history(session_id, message, response_text, user_role)
            
            return ChatResponse(
                message=response_text,
                confidence=0.85,  # Could be calculated based on context quality
                sources=["Real-time crisis intelligence", "Gemma AI"],
                timestamp=datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"Chat processing error: {e}")
            return ChatResponse(
                message="I'm experiencing technical difficulties. Please try again.",
                timestamp=datetime.utcnow()
            )
    
    async def _build_crisis_context(self, max_events: int = 15) -> str:
        """Build crisis context from current events"""
        
        query = """
        SELECT crisis_type, location_name, country_iso, severity, confidence, 
               source_name, magnitude, casualties, official_confirmed
        FROM crisis_events 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY confidence DESC, created_at DESC 
        LIMIT :max_events
        """
        
        try:
            events = await database.fetch_all(query, {"max_events": max_events})
            
            if not events:
                return "No active verified crisis events at this time."
            
            context_lines = ["📊 CURRENT VERIFIED CRISIS EVENTS:\n"]
            
            for i, event in enumerate(events, 1):
                crisis_type = (event["crisis_type"] or "Unknown").title()
                location = event["location_name"] or "Unknown Location"
                country = event["country_iso"] or "?"
                severity = (event["severity"] or "unknown").upper()
                confidence = event["confidence"] or 0
                source = event["source_name"] or "Unknown"
                
                extra_info = ""
                if event.get("magnitude"):
                    extra_info = f" | Magnitude: {event['magnitude']}"
                elif event.get("casualties"):
                    extra_info = f" | Est. Affected: {event['casualties']}"
                
                verified = "✅" if event["official_confirmed"] else "⚪"
                
                context_lines.append(
                    f"{i}. **{crisis_type}** in **{location}** ({country})\n"
                    f"   Severity: {severity} | Confidence: {confidence:.0%}{extra_info}\n"
                    f"   Source: {source} {verified}\n"
                )
            
            return "\n".join(context_lines)
            
        except Exception as e:
            logger.error(f"Error building crisis context: {e}")
            return "Unable to retrieve current crisis information."
    
    async def _generate_response(self, question: str, user_role: str, 
                               context: str, user_location: Optional[str] = None) -> str:
        """Generate AI response using Gemma"""
        
        instruction = self.role_instructions.get(user_role, self.role_instructions["citizen"])
        location_context = f"User location: {user_location}" if user_location else ""
        
        prompt = f"""{instruction}

{location_context}

{context}

User question: {question}

RESPONSE GUIDELINES:
- Answer ONLY based on the verified events listed above
- If no relevant data exists for the location, clearly state this
- Provide specific, actionable advice for the user's role
- Be concise but comprehensive (2-4 paragraphs maximum)
- Include confidence levels when citing specific events
- Use clear, professional language

Answer:"""

        return await self.client.generate_content(
            prompt, 
            temperature=0.2, 
            max_tokens=600
        )
    
    async def _save_chat_history(self, session_id: str, user_message: str, 
                               ai_response: str, user_role: str):
        """Save chat history to database"""
        
        try:
            # Save user message
            await database.execute(
                chat_history_table.insert(),
                {
                    "session_id": session_id,
                    "message_type": "user",
                    "content": user_message,
                    "user_role": user_role,
                    "timestamp": datetime.utcnow()
                }
            )
            
            # Save AI response
            await database.execute(
                chat_history_table.insert(),
                {
                    "session_id": session_id,
                    "message_type": "assistant", 
                    "content": ai_response,
                    "user_role": user_role,
                    "timestamp": datetime.utcnow()
                }
            )
            
        except Exception as e:
            logger.error(f"Error saving chat history: {e}")
    
    async def get_chat_history(self, session_id: str, limit: int = 50) -> List[Dict]:
        """Get chat history for a session"""
        
        query = """
        SELECT message_type, content, timestamp
        FROM chat_history 
        WHERE session_id = :session_id
        ORDER BY timestamp DESC
        LIMIT :limit
        """
        
        try:
            messages = await database.fetch_all(
                query, 
                {"session_id": session_id, "limit": limit}
            )
            
            return [
                {
                    "role": msg["message_type"],
                    "content": msg["content"],
                    "timestamp": msg["timestamp"].isoformat()
                }
                for msg in reversed(messages)  # Reverse to get chronological order
            ]
            
        except Exception as e:
            logger.error(f"Error retrieving chat history: {e}")
            return []
    
    def get_suggested_questions(self, user_role: str) -> List[str]:
        """Get role-specific suggested questions"""
        
        suggestions = {
            "citizen": [
                "Is my area safe right now?",
                "Should I evacuate my location?",
                "What emergency supplies do I need?",
                "Are there any active disasters near me?",
                "Where is the nearest safe shelter?"
            ],
            "government": [
                "Which areas need immediate resource allocation?",
                "What's the overall crisis situation assessment?",
                "How many people are affected by current events?",
                "What coordination actions are needed?",
                "Generate a situation report summary"
            ],
            "responder": [
                "What are the tactical priorities right now?",
                "Where should rescue teams be deployed?",
                "What's the most urgent response needed?",
                "Which incidents need immediate attention?",
                "What resources are needed for current operations?"
            ],
            "tourist": [
                "Is it safe to travel to Indonesia?",
                "Are there travel disruptions in Southeast Asia?",
                "Which tourist areas should I avoid?",
                "What's the safest route to my destination?",
                "Should I change my travel plans?"
            ]
        }
        
        return suggestions.get(user_role, suggestions["citizen"])