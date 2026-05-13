"""
Vanguard Sentinel — Live Data Pipeline Routes
Webhook endpoints for ingesting real log data from external sources:
  - POST /api/ingest/webhook        — Generic structured JSON log
  - POST /api/ingest/syslog         — Syslog-formatted entries
  - POST /api/ingest/cloudtrail     — AWS CloudTrail events

Each endpoint parses the incoming data, writes to Neo4j + ChromaDB,
and broadcasts a NEW_EVENT over WebSockets for real-time updates.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from backend.graph.neo4j_client import neo4j_client
from backend.vectorstore.chroma_client import chroma_client
from backend.realtime.ws_manager import ws_manager

router = APIRouter()


# ─── Schemas ──────────────────────────────────────────────

class WebhookLog(BaseModel):
    """Generic structured log entry from any source."""
    event_type: str
    severity: str = "medium"
    source_ip: Optional[str] = None
    target_asset: Optional[str] = None
    threat_actor: Optional[str] = None
    cve_id: Optional[str] = None
    description: str
    timestamp: Optional[str] = None
    metadata: Optional[dict] = Field(default_factory=dict)


class SyslogEntry(BaseModel):
    """Standard syslog message."""
    facility: Optional[int] = None
    severity: Optional[int] = None
    hostname: str
    message: str
    timestamp: Optional[str] = None


class CloudTrailEvent(BaseModel):
    """Simplified AWS CloudTrail event."""
    eventName: str
    eventSource: str
    sourceIPAddress: Optional[str] = None
    userIdentity: Optional[dict] = Field(default_factory=dict)
    requestParameters: Optional[dict] = Field(default_factory=dict)
    responseElements: Optional[dict] = Field(default_factory=dict)
    eventTime: Optional[str] = None


class BatchWebhookPayload(BaseModel):
    """Accept multiple logs at once for batch ingestion."""
    logs: List[WebhookLog]


# ─── Helpers ──────────────────────────────────────────────

async def _persist_and_broadcast(event: dict):
    """Write an event to Neo4j + ChromaDB and broadcast via WebSocket."""
    event_id = event.get("id", str(uuid.uuid4())[:8])

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
            {**event, "id": event_id},
        )

        # Link to source IP if present
        if event.get("source_ip"):
            neo4j_client.run_cypher(
                """
                MERGE (ip:IPAddress {address: $source_ip})
                MERGE (le:LogEntry {id: $id})
                MERGE (le)-[:ORIGINATED_FROM]->(ip)
                """,
                {"source_ip": event["source_ip"], "id": event_id},
            )

        # Link to target asset if present
        if event.get("target_asset"):
            neo4j_client.run_cypher(
                """
                MERGE (a:Asset {hostname: $target_asset})
                MERGE (le:LogEntry {id: $id})
                MERGE (le)-[:TARGETED]->(a)
                """,
                {"target_asset": event["target_asset"], "id": event_id},
            )

        # Link to threat actor if present
        if event.get("threat_actor"):
            neo4j_client.run_cypher(
                """
                MERGE (ta:ThreatActor {name: $threat_actor})
                MERGE (le:LogEntry {id: $id})
                MERGE (ta)-[:ATTRIBUTED_TO]->(le)
                """,
                {"threat_actor": event["threat_actor"], "id": event_id},
            )

        # Link to CVE if present
        if event.get("cve_id"):
            neo4j_client.run_cypher(
                """
                MERGE (v:Vulnerability {cve_id: $cve_id})
                MERGE (le:LogEntry {id: $id})
                MERGE (le)-[:EXPLOITED]->(v)
                """,
                {"cve_id": event["cve_id"], "id": event_id},
            )

        # Index in ChromaDB
        chroma_client.add_documents(
            texts=[event["description"]],
            metadatas=[{"event_type": event.get("event_type", "unknown"), "severity": event.get("severity", "medium")}],
            ids=[f"webhook-{event_id}"],
        )

        # Broadcast to WebSocket clients
        await ws_manager.broadcast("NEW_EVENT", {**event, "id": event_id})

    except Exception as e:
        print(f"[WARN] Pipeline persist failed: {e}")
        raise


# ─── Endpoints ────────────────────────────────────────────

@router.post("/api/ingest/webhook")
async def ingest_webhook(log: WebhookLog):
    """Ingest a single structured log entry from any webhook source."""
    event = log.model_dump()
    event["id"] = str(uuid.uuid4())[:8]
    event["timestamp"] = event.get("timestamp") or datetime.now(timezone.utc).isoformat()

    await _persist_and_broadcast(event)
    return {"status": "ingested", "id": event["id"]}


@router.post("/api/ingest/webhook/batch")
async def ingest_webhook_batch(payload: BatchWebhookPayload):
    """Ingest multiple log entries at once."""
    results = []
    for log in payload.logs:
        event = log.model_dump()
        event["id"] = str(uuid.uuid4())[:8]
        event["timestamp"] = event.get("timestamp") or datetime.now(timezone.utc).isoformat()
        try:
            await _persist_and_broadcast(event)
            results.append({"id": event["id"], "status": "ok"})
        except Exception as e:
            results.append({"id": event["id"], "status": "error", "detail": str(e)})

    return {"ingested": len([r for r in results if r["status"] == "ok"]), "total": len(results), "results": results}


@router.post("/api/ingest/syslog")
async def ingest_syslog(entry: SyslogEntry):
    """Ingest a syslog-formatted message. Auto-classifies severity."""
    # Map syslog severity (0=emergency ... 7=debug) to our levels
    syslog_severity_map = {0: "critical", 1: "critical", 2: "critical", 3: "high", 4: "high", 5: "medium", 6: "low", 7: "low"}
    severity = syslog_severity_map.get(entry.severity, "medium")

    event = {
        "id": str(uuid.uuid4())[:8],
        "event_type": "syslog",
        "severity": severity,
        "target_asset": entry.hostname,
        "description": entry.message,
        "timestamp": entry.timestamp or datetime.now(timezone.utc).isoformat(),
    }

    await _persist_and_broadcast(event)
    return {"status": "ingested", "id": event["id"], "mapped_severity": severity}


@router.post("/api/ingest/cloudtrail")
async def ingest_cloudtrail(event_data: CloudTrailEvent):
    """Ingest an AWS CloudTrail event. Maps CloudTrail fields to our ontology."""
    # Classify dangerous API calls
    dangerous_events = {"ConsoleLogin", "StopInstances", "DeleteBucket", "PutBucketPolicy", "CreateUser", "AttachUserPolicy"}
    severity = "high" if event_data.eventName in dangerous_events else "medium"

    user = event_data.userIdentity.get("arn", event_data.userIdentity.get("userName", "unknown"))

    event = {
        "id": str(uuid.uuid4())[:8],
        "event_type": f"cloudtrail_{event_data.eventName}",
        "severity": severity,
        "source_ip": event_data.sourceIPAddress,
        "threat_actor": user,
        "description": f"CloudTrail: {event_data.eventName} from {event_data.eventSource} by {user}",
        "timestamp": event_data.eventTime or datetime.now(timezone.utc).isoformat(),
    }

    await _persist_and_broadcast(event)
    return {"status": "ingested", "id": event["id"], "event": event_data.eventName}
