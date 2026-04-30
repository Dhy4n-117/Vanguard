"""
Vanguard Sentinel — Graph Route
GET /api/graph — Returns the full Neo4j graph data for force graph rendering.
"""

from fastapi import APIRouter, HTTPException
from backend.graph.neo4j_client import neo4j_client
from backend.models.schemas import GraphData

router = APIRouter()


@router.get("/api/graph", response_model=GraphData)
async def get_full_graph():
    """Return all nodes and relationships as JSON for the force-directed graph."""
    try:
        data = neo4j_client.get_full_graph()
        return GraphData(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph fetch failed: {str(e)}")
