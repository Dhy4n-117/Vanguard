"""
Vanguard Sentinel — Ingestion Route
POST /api/ingest — Generates mock logs, parses entities, and loads into Neo4j + ChromaDB.
"""

from fastapi import APIRouter, HTTPException
from backend.ingestion.mock_logs import generate_mock_logs
from backend.ingestion.parser import parse_log_entries
from backend.ingestion.loader import load_to_neo4j, load_to_chroma
from backend.graph.neo4j_client import neo4j_client
from backend.vectorstore.chroma_client import chroma_client
from backend.models.schemas import IngestResponse

router = APIRouter()


@router.post("/api/ingest", response_model=IngestResponse)
async def ingest_data():
    """
    Generate mock cybersecurity logs, parse entities, and load into
    Neo4j (graph) and ChromaDB (vectors).
    """
    try:
        # Clear existing data for clean re-ingestion
        neo4j_client.clear_database()
        chroma_client.clear()

        # Generate mock logs
        raw_logs = generate_mock_logs(120)

        # Parse entities and relationships
        parsed = parse_log_entries(raw_logs)

        # Load into Neo4j
        neo4j_counts = load_to_neo4j(parsed)

        # Embed into ChromaDB
        logs_embedded = load_to_chroma(parsed["log_entries"])

        return IngestResponse(
            nodes_created=neo4j_counts["nodes_created"],
            edges_created=neo4j_counts["edges_created"],
            logs_embedded=logs_embedded,
            message=f"✅ Ingested {len(raw_logs)} logs → {neo4j_counts['nodes_created']} nodes, {neo4j_counts['edges_created']} edges, {logs_embedded} embeddings",
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")
