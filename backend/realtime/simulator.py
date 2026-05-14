"""
Vanguard Sentinel — Live Event Simulator
Simulates a real-time stream of cybersecurity events for demonstration.
Generates new log events at a configurable interval and broadcasts
them over WebSockets + writes to Neo4j/ChromaDB.
"""

import asyncio
import random
import uuid
from datetime import datetime, timezone
from backend.realtime.ws_manager import ws_manager
from backend.graph.neo4j_client import neo4j_client
from backend.vectorstore.chroma_client import chroma_client

# ─── Simulation Data ──────────────────────────────────────

THREAT_ACTORS = ["APT28", "Lazarus", "DarkHydrus", "Cozy Bear", "Sandworm"]
ATTACKER_IPS = ["91.239.236.88", "185.56.83.108", "103.224.182.251", "45.77.65.12", "198.51.100.99"]
ASSETS = ["web-server-01", "web-server-02", "db-server-01", "mail-server", "vpn-gateway", "dns-server", "file-server-01", "auth-proxy"]
CVES = ["CVE-2024-3400", "CVE-2024-2188", "CVE-2024-27198", "CVE-2023-44487", "CVE-2024-0012", "CVE-2023-46805"]

EVENT_TYPES = [
    "brute_force", "port_scan", "exploit_attempt", "data_exfil",
    "phishing_attempt", "malware_detected", "lateral_movement",
    "privilege_escalation", "c2_beacon", "auth_failure",
]

SEVERITY_LEVELS = ["low", "medium", "high", "critical"]
SEVERITY_WEIGHTS = [0.2, 0.35, 0.3, 0.15]


def _generate_event() -> dict:
    """Generate a single realistic cybersecurity event."""
    event_type = random.choice(EVENT_TYPES)
    severity = random.choices(SEVERITY_LEVELS, weights=SEVERITY_WEIGHTS)[0]
    actor = random.choice(THREAT_ACTORS)
    src_ip = random.choice(ATTACKER_IPS)
    target = random.choice(ASSETS)
    cve = random.choice(CVES) if event_type in ["exploit_attempt", "privilege_escalation"] else None

    event = {
        "id": str(uuid.uuid4())[:8],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": event_type,
        "severity": severity,
        "source_ip": src_ip,
        "target_asset": target,
        "threat_actor": actor,
        "description": f"{actor} initiated {event_type.replace('_', ' ')} against {target} from {src_ip}",
    }
    if cve:
        event["cve_id"] = cve
        event["description"] += f" exploiting {cve}"

    return event


async def _persist_event(event: dict):
    """Write a single event to Neo4j as a LogEntry node + relationships."""
    try:
        # Create LogEntry node
        neo4j_client.run_cypher(
            """
            MERGE (le:LogEntry {id: $id})
            SET le.event_type = $event_type,
                le.severity = $severity,
                le.timestamp = $timestamp,
                le.description = $description
            """,
            event,
        )

        # Link to ThreatActor
        neo4j_client.run_cypher(
            """
            MERGE (ta:ThreatActor {name: $threat_actor})
            MERGE (le:LogEntry {id: $id})
            MERGE (ta)-[:ATTRIBUTED_TO]->(le)
            """,
            event,
        )

        # Link to source IP
        neo4j_client.run_cypher(
            """
            MERGE (ip:IPAddress {address: $source_ip})
            MERGE (le:LogEntry {id: $id})
            MERGE (le)-[:ORIGINATED_FROM]->(ip)
            """,
            event,
        )

        # Link to target Asset
        neo4j_client.run_cypher(
            """
            MERGE (a:Asset {hostname: $target_asset})
            MERGE (le:LogEntry {id: $id})
            MERGE (le)-[:TARGETED]->(a)
            """,
            event,
        )

        # Link to CVE if applicable
        if event.get("cve_id"):
            neo4j_client.run_cypher(
                """
                MERGE (v:Vulnerability {cve_id: $cve_id})
                MERGE (le:LogEntry {id: $id})
                MERGE (le)-[:EXPLOITED]->(v)
                """,
                event,
            )

        # Also index in ChromaDB for semantic search
        chroma_client.add_documents(
            texts=[event["description"]],
            metadatas=[{"event_type": event["event_type"], "severity": event["severity"]}],
            ids=[f"live-{event['id']}"],
        )
    except Exception as e:
        print(f"[WARN] Failed to persist live event: {e}")


class LiveEventSimulator:
    """Background task that generates and streams cyber events."""

    def __init__(self):
        self._task = None
        self._running = False
        self.events_generated = 0

    @property
    def is_running(self) -> bool:
        return self._running

    async def start(self, interval_seconds: float = 5.0):
        """Start generating events at the given interval."""
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._run_loop(interval_seconds))
        print(f"[STREAM] Live event simulator started (interval={interval_seconds}s)")

    async def stop(self):
        """Stop the event simulator."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        print(f"[STREAM] Live event simulator stopped (generated {self.events_generated} events)")

    async def _run_loop(self, interval: float):
        """Main loop: generate event → persist → broadcast."""
        while self._running:
            try:
                event = _generate_event()

                # Persist to databases
                await _persist_event(event)

                # Extract subgraph and broadcast
                subgraph = neo4j_client.get_subgraph_for_log(event["id"])
                payload = {"event": event, "subgraph": subgraph}

                # Broadcast to all connected WebSocket clients
                await ws_manager.broadcast("NEW_EVENT", payload)

                self.events_generated += 1

                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[WARN] Event loop error: {e}")
                await asyncio.sleep(interval)

    async def simulate_attack_burst(self):
        """Simulate a rapid sequence of events representing a coordinated attack."""
        actor = random.choice(THREAT_ACTORS)
        src_ip = random.choice(ATTACKER_IPS)
        target = random.choice(ASSETS)
        
        sequence = [
            ("port_scan", "low"),
            ("brute_force", "medium"),
            ("brute_force", "medium"),
            ("auth_failure", "medium"),
            ("privilege_escalation", "high"),
            ("malware_detected", "critical"),
            ("data_exfil", "critical")
        ]
        
        print(f"[STREAM] Simulating attack burst by {actor} from {src_ip} targeting {target}")
        
        for event_type, severity in sequence:
            event = {
                "id": str(uuid.uuid4())[:8],
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event_type": event_type,
                "severity": severity,
                "source_ip": src_ip,
                "target_asset": target,
                "threat_actor": actor,
                "description": f"{actor} initiated {event_type.replace('_', ' ')} against {target} from {src_ip}",
            }
            if event_type == "privilege_escalation":
                cve = random.choice(CVES)
                event["cve_id"] = cve
                event["description"] += f" exploiting {cve}"
                
            await _persist_event(event)
            
            subgraph = neo4j_client.get_subgraph_for_log(event["id"])
            payload = {"event": event, "subgraph": subgraph}
            
            await ws_manager.broadcast("NEW_EVENT", payload)
            self.events_generated += 1
            
            # Short burst delay
            await asyncio.sleep(0.5)


# Singleton
live_simulator = LiveEventSimulator()
