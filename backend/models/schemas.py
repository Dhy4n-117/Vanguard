"""
Vanguard Sentinel — Pydantic Schemas
Request/response models for all API endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ─── Graph Visualization ──────────────────────────────────

class GraphNode(BaseModel):
    id: str
    label: str                          # ThreatActor | IPAddress | Asset | Vulnerability | LogEntry
    name: str                           # Display name
    properties: dict = Field(default_factory=dict)


class GraphLink(BaseModel):
    source: str
    target: str
    type: str                           # Relationship label
    properties: dict = Field(default_factory=dict)


class GraphData(BaseModel):
    nodes: list[GraphNode] = Field(default_factory=list)
    links: list[GraphLink] = Field(default_factory=list)


# ─── Ingestion ────────────────────────────────────────────

class IngestResponse(BaseModel):
    nodes_created: int
    edges_created: int
    logs_embedded: int
    message: str = "Ingestion complete"


# ─── Query (GraphRAG) ────────────────────────────────────

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Natural language query")


class QueryResponse(BaseModel):
    answer: str
    cypher: str = ""
    subgraph: GraphData = Field(default_factory=GraphData)


# ─── Semantic Search ──────────────────────────────────────

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    top_k: int = Field(default=5, ge=1, le=50)


class SearchResult(BaseModel):
    text: str
    score: float
    metadata: dict = Field(default_factory=dict)


class SearchResponse(BaseModel):
    results: list[SearchResult] = Field(default_factory=list)


# ─── Health ───────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "ok"
    neo4j: str = "disconnected"
    chroma: str = "disconnected"
