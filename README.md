<div align="center">
  
# 🛡️ Vanguard Sentinel

### Open Source Knowledge-First Data OS for Cybersecurity

*A lightweight, locally-hosted alternative to Palantir Foundry & AIP — built for Cybersecurity Log Analysis and Threat Detection.*

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org)
[![Neo4j](https://img.shields.io/badge/Neo4j-Community-green.svg)](https://neo4j.com)

</div>

---

## Overview

Vanguard Sentinel ingests raw server logs, extracts cybersecurity entities (Threat Actors, IPs, Assets, Vulnerabilities), builds a knowledge graph in **Neo4j**, enables semantic search via **ChromaDB**, and exposes a natural-language **GraphRAG** query interface powered by **LangChain + Google Gemini** — all wrapped in a cyberpunk-inspired glassmorphism frontend.

### Key Features

- **📊 Interactive Threat Graph** — 2D force-directed visualization of entity relationships
- **💬 Natural Language Queries** — Ask questions in plain English, get Cypher-powered answers
- **🔍 Semantic Log Search** — Vector-based search over raw log text via ChromaDB
- **🧠 GraphRAG Pipeline** — LangChain translates NL → Cypher → Neo4j → AI Summary
- **🎨 Cyberpunk UI** — Dark-mode glassmorphism with interactive spotlight glow effects
- **🏠 Fully Local** — Runs entirely on your machine with free, open-source tools

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js + Tailwind CSS + react-force-graph-2d)   │
├─────────────────────────────────────────────────────────────┤
│  Backend (Python FastAPI)                                   │
│  ├── Ingestion Pipeline (Log Parser → Entity Extractor)     │
│  ├── GraphRAG Engine (LangChain + Gemini)                   │
│  └── REST API Layer                                         │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  ├── Neo4j Community Edition (Docker) — Knowledge Graph     │
│  └── ChromaDB (Embedded) — Vector Store                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| **Frontend**   | Next.js 15, Tailwind CSS, react-force-graph-2d |
| **Backend**    | Python 3.11+, FastAPI, Uvicorn          |
| **Graph DB**   | Neo4j Community Edition (Dockerized)    |
| **Vector DB**  | ChromaDB (embedded, local persistence)  |
| **AI/LLM**     | LangChain, Google Gemini API (Free Tier)|
| **Embeddings** | sentence-transformers (all-MiniLM-L6-v2)|

---

## Project Structure

```
Vanguard/
├── docker-compose.yml          # Neo4j container
├── .env.example                # Environment template
├── backend/                    # FastAPI server
│   ├── main.py                 # App entry point
│   ├── config.py               # Settings
│   ├── models/                 # Pydantic schemas & ontology
│   ├── ingestion/              # Log parsing & loading
│   ├── graph/                  # Neo4j client & queries
│   ├── vectorstore/            # ChromaDB client
│   ├── agentic/                # LangChain GraphRAG pipeline
│   └── routes/                 # API endpoints
└── frontend/                   # Next.js app
    └── src/
        ├── app/                # Pages & layouts
        ├── components/         # UI components
        ├── hooks/              # Custom hooks
        └── lib/                # API utilities
```

---

## Prerequisites

- **Docker Desktop** — for running Neo4j
- **Python 3.11+** — for the backend
- **Node.js 18+** — for the frontend
- **Google Gemini API Key** — [Get one free](https://makersuite.google.com/app/apikey)

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/vanguard-sentinel.git
cd vanguard-sentinel

# 2. Set up environment
cp .env.example .env
# Edit .env with your GEMINI_API_KEY

# 3. Start Neo4j
docker-compose up -d

# 4. Start the backend
cd backend
python -m venv venv && venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 5. Start the frontend
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <sub>Built with 🛡️ by the Vanguard team</sub>
</div>
