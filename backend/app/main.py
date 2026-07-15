# ======================================================================
# CrisisLens Production Backend - FastAPI Main Application
# ======================================================================
from fastapi import FastAPI, WebSocket, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import asyncio
import uvicorn
from datetime import datetime
from typing import List, Dict, Optional
import json
import logging

from .core.config import settings
from .core.database import database, init_db
from .api.v1.api import api_router
from .services.crisis_processor import CrisisProcessor
from .services.ai_chat import AIChatService
from .services.websocket_manager import WebSocketManager
from .models.crisis_event import CrisisEvent
from .utils.logger import setup_logging

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Global services
crisis_processor = None
chat_service = None
websocket_manager = WebSocketManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("🚀 Starting CrisisLens Production Backend...")
    
    # Initialize database
    await init_db()
    
    # Initialize services
    global crisis_processor, chat_service
    crisis_processor = CrisisProcessor()
    chat_service = AIChatService()
    
    # Start background data collection
    asyncio.create_task(start_background_collection())
    
    logger.info("✅ CrisisLens Backend Ready")
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down CrisisLens Backend...")
    await database.disconnect()

# Create FastAPI application
app = FastAPI(
    title="CrisisLens AI Platform",
    description="Production-ready disaster intelligence platform with multi-agent AI",
    version="2.0.0",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")

# Static files (for production)
import os
if not settings.DEBUG and os.path.exists("frontend/dist"):
    app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")

# WebSocket endpoint for real-time updates
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket_manager.connect(websocket, client_id)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "chat":
                # Handle chat messages
                response = await chat_service.process_message(
                    message.get("content", ""),
                    message.get("agent_role", "citizen"),
                    client_id
                )
                await websocket_manager.send_personal_message(
                    {"type": "chat_response", "content": response}, client_id
                )
            
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {e}")
    finally:
        websocket_manager.disconnect(client_id)

async def start_background_collection():
    """Start background data collection task"""
    while True:
        try:
            logger.info("🔄 Running background crisis data collection...")
            
            # Collect new data
            new_events = await crisis_processor.collect_and_process()
            
            if new_events:
                logger.info(f"📊 Found {len(new_events)} new crisis events")
                
                # Broadcast new events to all connected clients
                await websocket_manager.broadcast({
                    "type": "new_events",
                    "events": [event.dict() for event in new_events],
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            # Wait 5 minutes before next collection
            await asyncio.sleep(300)
            
        except Exception as e:
            logger.error(f"Background collection error: {e}")
            await asyncio.sleep(60)  # Wait 1 minute on error

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
        "services": {
            "database": await database.is_connected,
            "crisis_processor": crisis_processor is not None,
            "chat_service": chat_service is not None,
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )