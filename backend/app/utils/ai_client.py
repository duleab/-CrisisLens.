import os
from google import genai
from google.genai import types
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

class GemmaClient:
    def __init__(self):
        self.client = None
        self.model = settings.GEMMA_MODEL
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Gemma client"""
        try:
            if settings.GOOGLE_API_KEY:
                self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)
                logger.info("✅ Gemma AI client initialized")
            else:
                logger.warning("⚠️ No Google API key provided")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Gemma client: {e}")
    
    async def generate_content(self, prompt: str, temperature: float = 0.2, max_tokens: int = 500) -> str:
        """Generate content using Gemma"""
        if not self.client:
            return "AI service unavailable - no API key configured"
        
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens
                )
            )
            
            return response.text.strip() if response.text else "Empty response"
            
        except Exception as e:
            logger.error(f"Gemma generation error: {e}")
            return f"AI generation error: {str(e)[:100]}"
    
    def is_available(self) -> bool:
        """Check if AI client is available"""
        return self.client is not None

# Global client instance
_gemma_client = None

def get_gemma_client() -> GemmaClient:
    """Get global Gemma client instance"""
    global _gemma_client
    if _gemma_client is None:
        _gemma_client = GemmaClient()
    return _gemma_client