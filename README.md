# 🤖 Self-Evolving Autonomous Research Agent

> An autonomous AI research system that plans, researches, experiments, evaluates, and self-improves — governed by safety policies.

[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-blue?logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Development Guide](#-development-guide)
- [Module Ownership](#-module-ownership)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)

---

## 🔍 Overview

The **Self-Evolving Autonomous Research Agent** is a hackathon project that demonstrates an agentic AI system capable of:

1. **Understanding** a user's research question via natural language
2. **Planning** a multi-step autonomous research strategy
3. **Researching** via live web search (Tavily API)
4. **Retrieving** context using RAG (ChromaDB + embeddings)
5. **Experimenting** safely inside a Docker sandbox
6. **Evaluating** the quality of its own findings with a confidence score
7. **Improving** its strategy based on past iterations (self-evolution)
8. **Governing** every action through a safety policy layer
9. **Reporting** structured results with citations and evidence

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)               │
│        Dashboard │ Research Plan │ Governance Audit      │
└──────────────────────────┬──────────────────────────────┘
                           │ REST / WebSocket
┌──────────────────────────▼──────────────────────────────┐
│                   FastAPI Backend                        │
│                                                         │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐              │
│  │Governance│  │ Planner  │  │Orchestrator│             │
│  └─────────┘  └────┬─────┘  └─────┬─────┘             │
│                    │              │                      │
│  ┌─────────────────▼──────────────▼──────────────────┐  │
│  │              Research Pipeline                      │  │
│  │  Browser Tool │ Sandbox │ Memory │ Evaluation      │  │
│  └─────────────────────────────────────────────────── ┘  │
└──────────────────────────────────────────────────────────┘
         │                          │
┌────────▼──────┐         ┌─────────▼──────┐
│  PostgreSQL   │         │   ChromaDB     │
│  (Sessions,   │         │  (Embeddings,  │
│   Reports)    │         │   RAG Memory)  │
└───────────────┘         └────────────────┘
```

### Clean Architecture Layers

```
API Layer (Routers)
    ↓
Service Layer (Interfaces → Implementations)
    ↓
Domain Layer (Schemas, Models)
    ↓
Infrastructure Layer (DB, Vector DB, External APIs)
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Backend** | Python 3.11, FastAPI, Uvicorn |
| **Database** | PostgreSQL 16 |
| **Vector DB** | ChromaDB |
| **Agent Framework** | LangGraph (planned) |
| **Web Search** | Tavily API (planned) |
| **Sandbox** | Docker-in-Docker |
| **Communication** | REST API, WebSocket |
| **Containerization** | Docker, Docker Compose |

---

## 📁 Project Structure

```
.
├── README.md
├── docker-compose.yml
├── .env.example
├── .gitignore
├── requirements.txt
├── package.json
│
├── frontend/                     # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/                # Route-level page components
│   │   ├── layouts/              # Layout wrappers (sidebar, nav)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/             # API client and service calls
│   │   ├── contexts/             # React context providers
│   │   ├── utils/                # Utility functions
│   │   ├── types/                # TypeScript type definitions
│   │   └── assets/               # Static assets
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                      # FastAPI Python Backend
│   └── app/
│       ├── main.py               # FastAPI application entry point
│       ├── api/                  # API route handlers
│       ├── config/               # Settings and configuration
│       ├── core/                 # Cross-cutting concerns (logging, DI, exceptions)
│       ├── interfaces/           # Abstract interfaces for all modules
│       ├── schemas/              # Pydantic request/response models
│       ├── models/               # Database ORM models (future)
│       │
│       ├── research/             # [MODULE] Research Pipeline
│       ├── planner/              # [MODULE] Research Planner
│       ├── orchestrator/         # [MODULE] Agent Orchestrator (LangGraph)
│       ├── browser/              # [MODULE] Browser / Web Search Tool
│       ├── sandbox/              # [MODULE] Docker Sandbox Executor
│       ├── governance/           # [MODULE] Safety & Policy Engine
│       ├── memory/               # [MODULE] Memory & RAG
│       ├── evaluation/           # [MODULE] Quality Evaluation
│       ├── websocket/            # WebSocket connection manager
│       └── utils/                # Shared utilities
│
├── tests/                        # Pytest test suite
├── docker/                       # Dockerfiles and Nginx config
├── docs/                         # Architecture and API documentation
└── .github/workflows/            # GitHub Actions CI/CD
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd CodeRush2.0_InnovateX

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your API keys

# Start all services
docker compose up --build -d

# Check service health
docker compose ps

# View logs
docker compose logs -f backend
```

**Services will be available at:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs
- API Docs (ReDoc): http://localhost:8000/redoc
- PostgreSQL: localhost:5432
- ChromaDB: http://localhost:8001

### Option 2: Local Development

**Backend:**
```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp ../.env.example ../.env

# Run the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🧩 Module Ownership

Each module has a defined interface. Team members implement the logic independently.

| Module | Interface | Implementation File | Status |
|---|---|---|---|
| Research Pipeline | `IResearchPipeline` | `research/pipeline.py` | 🔲 Placeholder |
| Planner | `IPlanner` | `planner/planner.py` | 🔲 Placeholder |
| Orchestrator | `IAgentOrchestrator` | `orchestrator/orchestrator.py` | 🔲 Placeholder |
| Browser Tool | `IBrowserTool` | `browser/browser_tool.py` | 🔲 Placeholder |
| Sandbox | `ISandbox` | `sandbox/sandbox.py` | 🔲 Placeholder |
| Governance | `IGovernanceEngine` | `governance/governance.py` | 🔲 Placeholder |
| Memory / RAG | `IMemory` | `memory/memory.py` | 🔲 Placeholder |
| Evaluation | `IEvaluation` | `evaluation/evaluation.py` | 🔲 Placeholder |

> **How to implement a module:** Read the interface in `backend/app/interfaces/<module>.py`, implement the abstract methods in the corresponding implementation file, and register it in `backend/app/core/dependencies.py`.

---

## 📡 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Service health check |
| `/api/research` | POST | Submit a research question |
| `/api/research/{id}` | GET | Get research session status |
| `/api/planner/{id}` | GET | Get the research plan for a session |
| `/api/governance/check` | POST | Run a governance policy check |
| `/api/evaluation/{id}` | GET | Get evaluation results |
| `/api/report/{id}` | GET | Get the final structured report |
| `WS /ws/{session_id}` | WS | Real-time agent progress events |

Full API docs: http://localhost:8000/docs

---

## 🤝 Contributing

1. Pick a module from the **Module Ownership** table.
2. Read the interface contract in `backend/app/interfaces/`.
3. Implement the logic in the corresponding module file.
4. Add tests in `tests/`.
5. Submit a pull request targeting `main`.

See [docs/development-guide.md](docs/development-guide.md) for detailed instructions.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
