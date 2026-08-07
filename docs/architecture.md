# Architecture — Self-Evolving Autonomous Research Agent

## Overview

This document describes the clean architecture of the Research Agent system,
the boundaries between modules, and how they integrate through defined interfaces.

## Architectural Principles

1. **Clean Architecture** — Outer layers depend on inner layers. Inner layers have no knowledge of outer layers.
2. **SOLID Principles** — Each module has a single responsibility, is open for extension, closed for modification.
3. **Dependency Inversion** — All modules depend on abstractions (interfaces) not implementations.
4. **Module Independence** — Each module can be implemented and tested without the others.

## Layer Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Presentation Layer                          │
│                  (FastAPI Routers / WebSocket)                   │
│    Depends on: Interfaces (via Depends())                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Depends on interfaces
┌──────────────────────────────▼──────────────────────────────────┐
│                       Service Layer                              │
│         (Module Implementations in each module folder)           │
│    research/ | planner/ | orchestrator/ | browser/ | ...        │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Depends on schemas/models
┌──────────────────────────────▼──────────────────────────────────┐
│                       Domain Layer                               │
│              (Pydantic Schemas + Interfaces)                     │
│    schemas/ | interfaces/                                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Reads from
┌──────────────────────────────▼──────────────────────────────────┐
│                   Infrastructure Layer                           │
│    PostgreSQL | ChromaDB | Docker SDK | Tavily API | LangGraph  │
└─────────────────────────────────────────────────────────────────┘
```

## Module Contracts

Each module is defined by an interface in `app/interfaces/`. Teams must implement the abstract methods without changing the interface signatures.

| Module | Interface | Key Methods |
|---|---|---|
| Research Pipeline | `IResearchPipeline` | `start_research`, `get_session_status`, `stream_progress` |
| Planner | `IPlanner` | `generate_plan`, `validate_plan`, `adapt_plan` |
| Orchestrator | `IAgentOrchestrator` | `execute_plan`, `execute_step`, `get_agent_state` |
| Browser | `IBrowserTool` | `search`, `fetch_page`, `search_and_extract` |
| Sandbox | `ISandbox` | `execute_code`, `validate_code`, `cleanup` |
| Governance | `IGovernanceEngine` | `check_action`, `check_content`, `get_audit_log` |
| Memory | `IMemory` | `store`, `retrieve`, `get_session_context` |
| Evaluation | `IEvaluation` | `evaluate_findings`, `compare_iterations` |
| Report Generator | `IReportGenerator` | `generate_report`, `export_report` |

## Data Flow

```
User Input (question)
    │
    ▼
ResearchPipeline.start_research()
    │
    ├─► Governance.check_content(question)   ← Safety check on input
    │
    ├─► Planner.generate_plan(question)      ← Create step-by-step plan
    │
    └─► Orchestrator.execute_plan(plan)
            │
            ├─► Governance.check_action(step)     ← Check before each action
            │
            ├─► BrowserTool.search(query)          ← OR
            │   BrowserTool.fetch_page(url)
            │
            ├─► Sandbox.execute_code(code)         ← OR
            │
            ├─► Memory.store(content)              ← Store findings
            │
            └─► Memory.retrieve(query)             ← RAG lookup
    │
    ├─► Evaluation.evaluate_findings(findings)   ← Score quality
    │
    ├─► Planner.adapt_plan(plan, results)        ← Self-evolution (if should_continue)
    │
    └─► ReportGenerator.generate_report()        ← Final structured report
```

## State Machine (LangGraph)

The `AgentOrchestrator` is implemented as a LangGraph `StateGraph`:

```
IDLE
 └─► GOVERNANCE_CHECK ──(blocked)──► BLOCKED
          │
          └─(allowed)──► TOOL_ROUTING
                               │
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
         BROWSER_CALL    SANDBOX_CALL    MEMORY_STORE
               │               │               │
               └───────────────┴───────────────┘
                               │
                         STEP_COMPLETED
                               │
                        ┌──────┴──────┐
                        ▼             ▼
                  MORE_STEPS     EVALUATE
                        │             │
                        └─────────────┘
                               │
                   ┌───────────┴────────────┐
                   ▼                        ▼
              ADAPT_PLAN               COMPLETE
                   │
                   └──► IDLE (next iteration)
```

## WebSocket Event Schema

All real-time events emitted by the orchestrator follow this schema:

```json
{
  "type": "step_started | step_completed | step_failed | iteration_evaluated | session_completed",
  "session_id": "uuid",
  "step_id": "uuid (optional)",
  "step_title": "string (optional)",
  "message": "human-readable description",
  "result": { "key": "value" },
  "timestamp": "ISO 8601"
}
```
