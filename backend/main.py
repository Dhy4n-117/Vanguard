"""
Vanguard Sentinel — FastAPI Application
Main entry point for the backend server.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.graph.neo4j_client import neo4j_client
from backend.vectorstore.chroma_client import chroma_client
from backend.models.schemas import HealthResponse


# ─── Lifespan (startup/shutdown) ──────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize Neo4j and ChromaDB on startup, close on shutdown."""
    print("\n[SENTINEL] Vanguard Sentinel -- Starting up...")

    # Connect Neo4j
    try:
        neo4j_client.connect()
    except Exception as e:
        print(f"[WARN] Neo4j connection failed: {e}")
        print("   Make sure Docker is running: docker-compose up -d")

    # Connect ChromaDB
    try:
        chroma_client.connect()
    except Exception as e:
        print(f"[WARN] ChromaDB connection failed: {e}")

    print("[OK] Vanguard Sentinel -- Ready\n")
    yield

    # Shutdown
    neo4j_client.close()
    print("[SENTINEL] Vanguard Sentinel -- Shut down\n")


# ─── App Setup ────────────────────────────────────────────

app = FastAPI(
    title="Vanguard Sentinel API",
    description="Cybersecurity Knowledge Graph & Threat Detection Platform",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
from backend.middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)


# ─── Health Check ─────────────────────────────────────────

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Check the health of all services."""
    return HealthResponse(
        status="ok",
        neo4j="connected" if neo4j_client.is_connected() else "disconnected",
        chroma="connected" if chroma_client.is_connected() else "disconnected",
    )


# ─── Mount Routes ────────────────────────────────────────

from backend.routes.ingest import router as ingest_router
from backend.routes.query import router as query_router
from backend.routes.graph import router as graph_router
from backend.routes.search import router as search_router
from backend.routes.stream import router as stream_router
from backend.routes.pipeline import router as pipeline_router
from backend.routes.report import router as report_router

app.include_router(ingest_router, tags=["Ingestion"])
app.include_router(query_router, tags=["Query"])
app.include_router(graph_router, tags=["Graph"])
app.include_router(search_router, tags=["Search"])
app.include_router(stream_router, tags=["Streaming"])
app.include_router(pipeline_router, tags=["Pipeline"])
app.include_router(report_router, tags=["Report"])


# ─── Root ─────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "name": "Vanguard Sentinel API",
        "version": "0.1.0",
        "docs": "/docs",
    }
