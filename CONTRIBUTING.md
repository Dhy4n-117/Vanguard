# Contributing to Vanguard Sentinel

Thank you for considering contributing to Vanguard Sentinel! This document provides guidelines for contributing.

## Development Setup

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Docker Desktop** (for Neo4j)
- **Ollama** — for local AI ([Install from ollama.com](https://ollama.com))

### Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/Dhy4n-117/Vanguard.git
cd Vanguard

# 2. Start Neo4j
docker-compose up -d

# 3. Backend setup
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r backend/requirements.txt

# 4. Pull a local AI model
ollama pull llama3

# 5. Environment variables
cp .env.example .env
# Default config uses Ollama — no API keys needed

# 5. Start backend
uvicorn backend.main:app --reload --port 8000

# 6. Frontend setup (separate terminal)
cd frontend
npm install
npm run dev
```

### Verify Everything Works

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs
- Neo4j Browser: http://localhost:7474

## Project Structure

```
Vanguard/
├── backend/
│   ├── agentic/        # LangChain GraphRAG pipeline
│   ├── graph/          # Neo4j client and Cypher queries
│   ├── ingestion/      # Log parsing and data loading
│   ├── models/         # Pydantic schemas and ontology
│   ├── routes/         # FastAPI endpoints
│   └── vectorstore/    # ChromaDB semantic search
├── frontend/
│   └── src/
│       ├── app/        # Next.js pages and layout
│       ├── components/ # React components
│       └── lib/        # API client utilities
└── docker-compose.yml  # Neo4j container
```

## Coding Standards

- **Python**: Follow PEP 8, use type hints, max line length 120
- **JavaScript**: Use functional components, JSDoc for exports
- **CSS**: Use CSS custom properties from the design system
- **Commits**: Use [Conventional Commits](https://conventionalcommits.org/) — `feat:`, `fix:`, `docs:`, `chore:`

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit with conventional commit messages
4. Push and open a Pull Request
5. Describe what your changes do and why

## Reporting Issues

Please include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Python version, Node version)
- Relevant error messages or screenshots

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
