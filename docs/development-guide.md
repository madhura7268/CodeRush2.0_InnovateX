# Development Guide

## Getting Started

See [README.md](../README.md) for initial setup instructions.

## How to Implement a Module

All modules follow the same pattern:

### Step 1: Read the Interface

Every module has an abstract interface in `backend/app/interfaces/<module>.py`.
Read it thoroughly — the docstrings explain what each method should do.

```bash
cat backend/app/interfaces/planner.py
```

### Step 2: Implement the Module

Open the placeholder file in the module folder and replace the `TODO` bodies:

```python
# backend/app/planner/planner.py
class ResearchPlanner(IPlanner):
    async def generate_plan(self, question: str, session_id: str) -> ResearchPlan:
        # YOUR IMPLEMENTATION HERE
        ...
```

### Step 3: Register the Dependency (if needed)

If your implementation needs new dependencies (DB client, API key, etc.),
add them to `backend/app/core/dependencies.py`:

```python
def get_planner(settings: SettingsDep) -> IPlanner:
    return ResearchPlanner(
        settings=settings,
        db=get_db(),  # Add new deps here
    )
```

### Step 4: Write Tests

Add tests in `tests/test_<module>.py`:

```python
@pytest.mark.asyncio
async def test_planner_generates_valid_plan():
    planner = ResearchPlanner(settings=get_settings())
    plan = await planner.generate_plan("Test question?", "test-session")
    assert len(plan.steps) > 0
    assert plan.session_id == "test-session"
```

### Step 5: Update Docker Compose (if needed)

If your module needs a new external service, add it to `docker-compose.yml`.

---

## Module-Specific Guidance

### Planner Module
- **File:** `backend/app/planner/planner.py`
- **Approach:** Use `langchain` structured output with a Pydantic model (`ResearchPlan`)
- **LLM calls:** via `ChatOpenAI` or `ChatGoogleGenerativeAI`
- **Dependency:** `OPENAI_API_KEY` or `GOOGLE_API_KEY` in `.env`

### Orchestrator Module
- **File:** `backend/app/orchestrator/orchestrator.py`
- **Approach:** `langgraph.graph.StateGraph` with conditional routing
- **Persistence:** `PostgresSaver` from langgraph for pause/resume
- **Dependency:** Planner, Governance, BrowserTool, Sandbox, Memory

### Browser/Search Module
- **File:** `backend/app/browser/browser_tool.py`
- **Approach:** `from tavily import TavilyClient`
- **Dependency:** `TAVILY_API_KEY` in `.env`

### Memory Module
- **File:** `backend/app/memory/memory.py`
- **Approach:** `chromadb.HttpClient` + OpenAI embeddings
- **Dependency:** ChromaDB running (`docker compose up chromadb`)

### Governance Module
- **File:** `backend/app/governance/governance.py`
- **Approach:** Rule-based (fast) + LLM-based content screening (slower)

### Evaluation Module
- **File:** `backend/app/evaluation/evaluation.py`
- **Approach:** LLM-as-judge with structured output (dimension scores)

---

## Code Style

- Python: Follow PEP 8. Use `ruff` for formatting (`ruff format .`)
- TypeScript: Use `strict` mode. No `any` types.
- All async functions should use `async def` / `await`
- All Pydantic models use type hints on all fields
- All interfaces have docstrings explaining the contract

## Running Tests

```bash
# Backend
cd backend
pytest ../tests/ -v

# Frontend type check
cd frontend
npm run type-check
```
