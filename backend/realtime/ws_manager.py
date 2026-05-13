"""
Vanguard Sentinel — WebSocket Manager
Manages connected clients and broadcasts real-time events (new nodes, links, alerts).
"""

import asyncio
import json
from typing import Set
from fastapi import WebSocket


class ConnectionManager:
    """Manages WebSocket connections and broadcasts events to all clients."""

    def __init__(self):
        self._connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)
        print(f"[WS] Client connected ({len(self._connections)} total)")

    async def disconnect(self, websocket: WebSocket):
        """Remove a disconnected WebSocket."""
        async with self._lock:
            self._connections.discard(websocket)
        print(f"[WS] Client disconnected ({len(self._connections)} total)")

    async def broadcast(self, event_type: str, data: dict):
        """Broadcast a JSON event to all connected clients."""
        if not self._connections:
            return

        message = json.dumps({
            "type": event_type,
            "data": data,
        })

        # Copy the set to avoid mutation during iteration
        dead_connections = set()
        async with self._lock:
            connections = set(self._connections)

        for ws in connections:
            try:
                await ws.send_text(message)
            except Exception:
                dead_connections.add(ws)

        # Clean up dead connections
        if dead_connections:
            async with self._lock:
                self._connections -= dead_connections

    @property
    def client_count(self) -> int:
        return len(self._connections)


# Singleton instance
ws_manager = ConnectionManager()
