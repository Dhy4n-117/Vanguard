"""
Vanguard Sentinel — Search Route
POST /api/search — Semantic search over log entries via ChromaDB.
"""

from fastapi import APIRouter, HTTPException
from backend.vectorstore.chroma_client import chroma_client
from backend.models.schemas import SearchRequest, SearchResponse, SearchResult

router = APIRouter()


@router.post("/api/search", response_model=SearchResponse)
async def semantic_search(request: SearchRequest):
    """Perform semantic search over embedded log entries."""
    try:
        results = chroma_client.search(query=request.query, top_k=request.top_k)
        return SearchResponse(
            results=[SearchResult(**r) for r in results]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
