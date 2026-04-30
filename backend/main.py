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
    print("\n🛡️  Vanguard Sentinel — Starting up...")

    # Connect Neo4j
    try:
        neo4j_client.connect()
    except Exception as e:
        print(f"⚠️  Neo4j connection failed: {e}")
        print("   Make sure Docker is running: docker-compose up -d")

    # Connect ChromaDB
    try:
        chroma_client.connect()
    except Exception as e:
        print(f"⚠️  ChromaDB connection failed: {e}")

    print("🚀 Vanguard Sentinel — Ready\n")
    yield

    # Shutdown
    neo4j_client.close()
    print("🛡️  Vanguard Sentinel — Shut down\n")


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

app.include_router(ingest_router, tags=["Ingestion"])
app.include_router(query_router, tags=["Query"])
app.include_router(graph_router, tags=["Graph"])
app.include_router(search_router, tags=["Search"])


# ─── Root ─────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "name": "Vanguard Sentinel API",
        "version": "0.1.0",
        "docs": "/docs",
    }
