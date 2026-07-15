from typing import Dict, List
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)

class WebSocketManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        # Store active connections by client_id
        self.active_connections: Dict[str, WebSocket] = {}
        # Group connections by role for targeted broadcasting
        self.connections_by_role: Dict[str, List[str]] = {
            "citizen": [],
            "government": [],
            "responder": [],
            "tourist": []
        }
        # Store client metadata
        self.client_metadata: Dict[str, Dict] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept new WebSocket connection"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.client_metadata[client_id] = {
            "connected_at": None,
            "role": "citizen",
            "location": None
        }
        logger.info(f"WebSocket client {client_id} connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, client_id: str):
        """Remove WebSocket connection"""
        if client_id in self.active_connections:
            # Remove from role groups
            for role_clients in self.connections_by_role.values():
                if client_id in role_clients:
                    role_clients.remove(client_id)
            
            # Remove from active connections
            del self.active_connections[client_id]
            
            # Remove metadata
            if client_id in self.client_metadata:
                del self.client_metadata[client_id]
            
            logger.info(f"WebSocket client {client_id} disconnected. Total: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, client_id: str):
        """Send message to specific client"""
        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to {client_id}: {e}")
                self.disconnect(client_id)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        if not self.active_connections:
            return
        
        message_text = json.dumps(message)
        disconnected_clients = []
        
        for client_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(message_text)
            except Exception as e:
                logger.error(f"Error broadcasting to {client_id}: {e}")
                disconnected_clients.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected_clients:
            self.disconnect(client_id)
        
        if disconnected_clients:
            logger.info(f"Cleaned up {len(disconnected_clients)} disconnected clients")
    
    async def broadcast_to_role(self, message: dict, role: str):
        """Broadcast message to clients with specific role"""
        if role not in self.connections_by_role:
            return
        
        client_ids = self.connections_by_role[role].copy()
        message_text = json.dumps(message)
        disconnected_clients = []
        
        for client_id in client_ids:
            if client_id in self.active_connections:
                websocket = self.active_connections[client_id]
                try:
                    await websocket.send_text(message_text)
                except Exception as e:
                    logger.error(f"Error sending to {role} client {client_id}: {e}")
                    disconnected_clients.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected_clients:
            self.disconnect(client_id)
    
    def update_client_metadata(self, client_id: str, role: str = None, location: str = None):
        """Update client metadata"""
        if client_id not in self.client_metadata:
            return
        
        metadata = self.client_metadata[client_id]
        
        # Update role
        if role and role in self.connections_by_role:
            # Remove from old role
            old_role = metadata.get("role")
            if old_role and client_id in self.connections_by_role[old_role]:
                self.connections_by_role[old_role].remove(client_id)
            
            # Add to new role
            if client_id not in self.connections_by_role[role]:
                self.connections_by_role[role].append(client_id)
            
            metadata["role"] = role
        
        # Update location
        if location:
            metadata["location"] = location
    
    def get_connection_stats(self) -> dict:
        """Get connection statistics"""
        return {
            "total_connections": len(self.active_connections),
            "connections_by_role": {
                role: len(clients) for role, clients in self.connections_by_role.items()
            },
            "active_clients": list(self.active_connections.keys())
        }
    
    async def send_crisis_alert(self, crisis_event: dict, target_roles: List[str] = None):
        """Send crisis alert to specific roles or all clients"""
        
        alert_message = {
            "type": "crisis_alert",
            "event": crisis_event,
            "timestamp": crisis_event.get("created_at"),
            "severity": crisis_event.get("severity", "medium")
        }
        
        if target_roles:
            for role in target_roles:
                if role in self.connections_by_role:
                    await self.broadcast_to_role(alert_message, role)
        else:
            await self.broadcast(alert_message)
    
    async def send_system_notification(self, message: str, notification_type: str = "info"):
        """Send system notification to all clients"""
        
        notification = {
            "type": "system_notification",
            "message": message,
            "notification_type": notification_type,
            "timestamp": None  # Will be set on client side
        }
        
        await self.broadcast(notification)