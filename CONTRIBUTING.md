# Contributing to Vanguard Sentinel

![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)
![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg?style=flat-square)
![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg?style=flat-square)
![Node.js 18+](https://img.shields.io/badge/Node.js-18+-green.svg?style=flat-square)
![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg?style=flat-square)

---

## 👋 Welcome

Thank you for your interest in contributing to **Vanguard Sentinel** — an open-source cybersecurity knowledge graph OS.

Vanguard Sentinel ingests raw server logs, extracts cybersecurity entities, builds a knowledge graph in Neo4j, enables semantic search via ChromaDB, and exposes a natural-language GraphRAG query interface powered by LangChain + local AI (Ollama). All of this is wrapped in a cyberpunk-inspired glassmorphism frontend.

Whether you're fixing a typo, reporting a bug, improving documentation, or building a new feature — every contribution matters.

---

## 📜 Code of Conduct

We are committed to fostering a welcoming and inclusive community. All participants are expected to:

- **Be respectful** — Treat everyone with dignity. No harassment, discrimination, or personal attacks.
- **Be constructive** — Offer feedback that helps others grow. Critique ideas, not people.
- **Be collaborative** — Work together in good faith. Assume the best intentions.
- **Be inclusive** — Welcome newcomers and help them get started.
- **Be professional** — Maintain a standard of discourse appropriate for a professional open-source project.

Violations of this code of conduct may result in removal from the project. If you experience or witness unacceptable behavior, please open an issue or contact the maintainers directly.

---

## 🚀 Getting Started

### Prerequisites

Before you begin, make sure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest | Runs Neo4j in a container |
| [Python](https://python.org) | 3.11+ | Backend runtime |
| [Node.js](https://nodejs.org) | 18+ | Frontend runtime |
| [Ollama](https://ollama.com) | Latest | Local AI model inference |

### Setup Instructions

```bash
# 1. Clone the repository
git clone https://github.com/Dhy4n-117/Vanguard.git
cd Vanguard

# 2. Start Neo4j via Docker
docker-compose up -d

# 3. Set up environment variables
cp .env.example .env
# Default config uses Ollama — no API keys needed

# 4. Pull a local AI model
ollama pull llama3
```

#### Backend Setup

```bash
# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r backend/requirements.txt

# Start the backend server
uvicorn backend.main:app --reload --port 8000
```

#### Frontend Setup

```bash
# In a separate terminal
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Verify Everything Works

| Service | URL |
|---------|-----|
| Frontend | [http://localhost:3000](http://localhost:3000) |
| Backend API Docs | [http://localhost:8000/docs](http://localhost:8000/docs) |
| Neo4j Browser | [http://localhost:7474](http://localhost:7474) |

---

## 📁 Project Structure

```
Vanguard/
├── docker-compose.yml            # Neo4j container configuration
├── .env.example                  # Environment variable template
├── backend/                      # Python FastAPI server
│   ├── main.py                   # Application entry point & lifespan
│   ├── config.py                 # Pydantic BaseSettings configuration
│   ├── middleware.py             # Request logging & security headers
│   ├── agentic/                  # LangChain GraphRAG pipeline
│   │   ├── agent.py              # Agentic query engine
│   │   └── tools.py              # LangChain tool definitions
│   ├── graph/                    # Neo4j client & Cypher queries
│   │   └── neo4j_client.py       # Driver wrapper & graph operations
│   ├── ingestion/                # Log parsing & data loading
│   ├── models/                   # Pydantic schemas & ontology
│   ├── realtime/                 # WebSocket manager & live simulator
│   ├── routes/                   # FastAPI endpoint routers
│   │   ├── graph.py              # Graph data endpoints
│   │   ├── ingest.py             # Log ingestion endpoints
│   │   ├── query.py              # Natural-language query endpoint
│   │   ├── search.py             # Semantic search endpoint
│   │   ├── stream.py             # WebSocket streaming endpoint
│   │   ├── pipeline.py           # Full pipeline endpoint
│   │   └── report.py             # Incident report generation
│   └── vectorstore/              # ChromaDB semantic search
│       └── chroma_client.py      # ChromaDB client wrapper
├── frontend/                     # Next.js application
│   └── src/
│       ├── app/                  # Pages, layouts & routing
│       ├── components/           # Reusable React components
│       ├── hooks/                # Custom React hooks
│       └── lib/                  # API client utilities & helpers
└── data/                         # Sample log data for ingestion
```

---

## 🔄 Development Workflow

We follow a standard **fork-and-branch** workflow:

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Vanguard.git
   cd Vanguard
   ```
3. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feat/your-feature
   ```
4. **Make your changes** — write code, add tests, update docs.
5. **Run linting and tests** to ensure everything passes:
   ```bash
   # Python
   ruff check backend/
   python -m pytest

   # JavaScript
   cd frontend && npm run lint
   ```
6. **Commit** your changes using [conventional commits](#-commit-convention).
7. **Push** to your fork:
   ```bash
   git push origin feat/your-feature
   ```
8. **Open a Pull Request** against the `main` branch of the upstream repo.

---

## 📝 Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) to keep our git history clean and generate changelogs automatically.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(graph): add blast radius calculation` |
| `fix` | Bug fix | `fix(ingest): handle malformed log timestamps` |
| `docs` | Documentation changes | `docs: update CONTRIBUTING.md` |
| `refactor` | Code restructuring (no behavior change) | `refactor(agent): simplify tool dispatch logic` |
| `ui` | UI/UX changes | `ui(dashboard): add collapsible stats panel` |
| `chore` | Maintenance & housekeeping | `chore: update dependencies` |
| `test` | Adding or updating tests | `test(graph): add Neo4j client unit tests` |
| `perf` | Performance improvements | `perf(search): optimize vector similarity query` |
| `ci` | CI/CD configuration changes | `ci: add GitHub Actions workflow` |

### Examples

```bash
git commit -m "feat(report): add incident report generation endpoint"
git commit -m "fix(neo4j): handle connection timeout gracefully"
git commit -m "docs: add API usage examples to README"
git commit -m "ui(chat): improve message bubble styling"
```

---

## 🎨 Code Style

### Python (Backend)

- Follow [PEP 8](https://peps.python.org/pep-0008/) conventions.
- **Type hints** — All function parameters and return types must be annotated.
- **Docstrings** — All public functions, classes, and modules should have docstrings.
- **Max line length** — 120 characters.
- **Formatter/Linter** — Use [Ruff](https://docs.astral.sh/ruff/) for linting and formatting.
- **Async** — Use `async def` for all FastAPI route handlers.

```python
async def get_threat_actors(limit: int = 10) -> list[dict]:
    """Fetch active threat actors from the knowledge graph.

    Args:
        limit: Maximum number of results to return.

    Returns:
        A list of threat actor dictionaries.
    """
    ...
```

### JavaScript / TypeScript (Frontend)

- **ESLint** — Follow the project's ESLint configuration (extends Next.js defaults).
- **Prettier** — All code must be formatted with Prettier.
- **JSDoc** — Add JSDoc comments to exported functions and components.
- **Functional components** — Use React functional components with hooks.
- **Named exports** — Prefer named exports over default exports for utilities.

```jsx
/**
 * Displays a threat actor node card with severity indicator.
 * @param {Object} props
 * @param {string} props.name - The threat actor name.
 * @param {string} props.severity - Severity level (critical, high, medium, low).
 */
export function ThreatActorCard({ name, severity }) {
  // ...
}
```

### CSS / Styling

- **Tailwind CSS** — Use utility classes for layout and styling.
- **CSS Variables** — Use CSS custom properties defined in the design system for theming (colors, gradients, glassmorphism effects).
- **No inline styles** — Avoid inline `style` attributes; use Tailwind or CSS modules.

---

## 🔀 Pull Request Guidelines

A good pull request:

- [ ] **Has a clear title** following the commit convention (e.g., `feat(graph): add node clustering`).
- [ ] **Describes what changed and why** — not just *what* the code does, but the motivation behind it.
- [ ] **Is focused** — addresses a single concern. Avoid mixing unrelated changes.
- [ ] **Includes relevant tests** — or explains why tests aren't applicable.
- [ ] **Passes CI checks** — linting, type checks, and tests must be green.
- [ ] **Updates documentation** — if your change affects public APIs, CLI usage, or setup steps.
- [ ] **Has screenshots/recordings** — for UI changes, include before/after visuals.
- [ ] **References related issues** — use `Closes #123` or `Fixes #456` in the description.

### PR Review Process

1. A maintainer will review your PR within a few days.
2. You may be asked to make revisions — this is normal and collaborative.
3. Once approved, a maintainer will merge the PR.

---

## 🐛 Reporting Issues

Found a bug? Have a feature request? Please [open an issue](https://github.com/Dhy4n-117/Vanguard/issues/new) with the following details:

### Bug Reports

- **Title**: A concise summary (e.g., "Graph fails to render when no edges exist").
- **Environment**: OS, Python version, Node.js version, browser.
- **Steps to Reproduce**: Numbered steps to trigger the issue.
- **Expected Behavior**: What you expected to happen.
- **Actual Behavior**: What actually happened.
- **Error Messages**: Full stack traces, console errors, or screenshots.
- **Additional Context**: Relevant configuration, log excerpts, or sample data.

### Feature Requests

- **Problem**: Describe the problem your feature would solve.
- **Proposed Solution**: How you'd like it to work.
- **Alternatives Considered**: Other approaches you've thought about.

---

## 📄 License

By contributing to Vanguard Sentinel, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with 🛡️ by the Vanguard community</sub>
</div>
