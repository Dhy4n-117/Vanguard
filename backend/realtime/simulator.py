"""
Vanguard Sentinel — Threat Simulator
Generates mock cybersecurity events and subgraphs for the live feed.
"""

import asyncio
import random
import uuid
from datetime import datetime
from backend.realtime.ws_manager import ws_manager

# Mock data templates
EVENT_TYPES = [
    "port_scan", "brute_force", "malware_detected", 
    "privilege_escalation", "c2_beacon", "data_exfiltration", "exploit_attempt"
]

ASSETS = ["web-server-01", "db-server-prod", "mail-server", "vpn-gateway", "auth-proxy", "file-server-01"]
SEVERITIES = ["low", "medium", "high", "critical"]

class ThreatSimulator:
    def __init__(self):
        self.is_running = False
        self.events_generated = 0
        self._task = None

    async def start(self, interval_seconds: float = 5.0):
        if self.is_running:
            return
        self.is_running = True
        self._task = asyncio.create_task(self._run(interval_seconds))
        print(f"[SIM] Threat simulation started (interval: {interval_seconds}s)")

    async def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()
        print("[SIM] Threat simulation stopped")

    async def _run(self, interval: float):
        while self.is_running:
            try:
                await self.generate_single_event()
                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[SIM] Error: {e}")
                await asyncio.sleep(1)

    async def generate_single_event(self):
        # 1. Generate a mock event
        event = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now().isoformat(),
            "event_type": random.choice(EVENT_TYPES),
            "target_asset": random.choice(ASSETS),
            "severity": random.choice(SEVERITIES),
            "description": "Anomalous activity detected via real-time telemetry."
        }

        # 2. Build a mini-subgraph for the event
        subgraph = {
            "nodes": [
                {"id": f"log-{event['id']}", "label": "LogEntry", "name": event['event_type'], "properties": event},
                {"id": f"asset-{event['target_asset']}", "label": "Asset", "name": event['target_asset'], "properties": {"hostname": event['target_asset']}}
            ],
            "links": [
                {"source": f"asset-{event['target_asset']}", "target": f"log-{event['id']}", "type": "HAS_LOG"}
            ]
        }

        # 3. Broadcast
        await ws_manager.broadcast({
            "type": "NEW_EVENT",
            "data": {
                "event": event,
                "subgraph": subgraph
            }
        })
        self.events_generated += 1

    async def simulate_attack_burst(self, count: int = 5):
        """Simulate a targeted attack sequence."""
        for _ in range(count):
            await self.generate_single_event()
            await asyncio.sleep(0.5)

live_simulator = ThreatSimulator()
