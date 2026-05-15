"""
Vanguard Sentinel — Connection Manager
Manages WebSocket connections for real-time telemetry.
"""

from typing import List, Dict
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # active_connections: List[WebSocket] = []
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WS] New client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[WS] Client disconnected. Remaining: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Send JSON message to all connected clients."""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                # Handle broken connections silently
                print(f"[WS] Broadcast error: {e}")

manager = ConnectionManager()
