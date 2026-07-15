from fastapi import APIRouter
from .endpoints import crisis, chat, websocket, dashboard

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(crisis.router, prefix="/crisis", tags=["crisis"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])  
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(websocket.router, prefix="/ws", tags=["websocket"])