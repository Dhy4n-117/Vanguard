"""
Vanguard Sentinel — Query Route
POST /api/query — Natural language query → GraphRAG pipeline → AI answer + subgraph.
"""

from fastapi import APIRouter, HTTPException
from backend.models.schemas import QueryRequest, QueryResponse
from backend.agentic.pipeline import run_query_pipeline

router = APIRouter()


@router.post("/api/query", response_model=QueryResponse)
async def query_graph(request: QueryRequest):
    """
    Process a natural language query through the GraphRAG pipeline.
    Returns an AI-generated answer, the Cypher query used, and a subgraph for visualization.
    """
    try:
        response = await run_query_pipeline(request.query)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")
