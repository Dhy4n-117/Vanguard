"""
Vanguard Sentinel — WebSocket & Live Stream Routes
- /api/ws/stream    — WebSocket endpoint for real-time event streaming
- /api/stream/start — Start the live event simulator
- /api/stream/stop  — Stop the live event simulator
- /api/stream/status — Get simulator status
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.realtime.ws_manager import ws_manager
from backend.realtime.simulator import live_simulator

router = APIRouter()


@router.websocket("/api/ws/stream")
async def websocket_stream(websocket: WebSocket):
    """WebSocket endpoint — clients connect here to receive live events."""
    await ws_manager.connect(websocket)
    try:
        # Keep the connection alive; listen for any client messages (e.g., pings)
        while True:
            data = await websocket.receive_text()
            # Echo back as acknowledgment (useful for ping/pong)
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception:
        await ws_manager.disconnect(websocket)


@router.post("/api/stream/start")
async def start_stream(interval: float = 5.0):
    """Start the live event simulator. Interval is in seconds."""
    if live_simulator.is_running:
        return {"status": "already_running", "events_generated": live_simulator.events_generated}

    await live_simulator.start(interval_seconds=max(1.0, min(interval, 30.0)))
    return {"status": "started", "interval": interval}


@router.post("/api/stream/stop")
async def stop_stream():
    """Stop the live event simulator."""
    await live_simulator.stop()
    return {"status": "stopped", "events_generated": live_simulator.events_generated}

import asyncio
@router.post("/api/stream/simulate-attack")
async def simulate_attack():
    """Triggers a burst of malicious events representing a targeted attack."""
    # Run in background so request returns immediately
    asyncio.create_task(live_simulator.simulate_attack_burst())
    return {"status": "attack_initiated"}


@router.get("/api/stream/status")
async def stream_status():
    """Get the current status of the live event simulator."""
    return {
        "running": live_simulator.is_running,
        "events_generated": live_simulator.events_generated,
        "connected_clients": ws_manager.client_count,
    }
