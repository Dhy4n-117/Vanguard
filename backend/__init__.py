# Vanguard Sentinel — Backend Package
"""
Vanguard Sentinel Backend
Cybersecurity Knowledge Graph & Threat Detection Platform

Modules:
    - config: Environment configuration via Pydantic
    - models: Pydantic schemas and Neo4j ontology definitions
    - graph: Neo4j driver wrapper and Cypher query templates
    - ingestion: Mock log generation, parsing, and loading
    - vectorstore: ChromaDB semantic search client
    - agentic: LangChain GraphRAG pipeline (Gemini + Neo4j)
    - routes: FastAPI API endpoints
"""

__version__ = "0.1.0"
