"""
Agent Orchestrator

Implements: IAgentOrchestrator
"""

from collections.abc import AsyncGenerator
from typing import Any
from datetime import datetime, timezone

from app.config.settings import Settings
from app.core.logging import get_logger
from app.interfaces.orchestrator import IAgentOrchestrator
from app.schemas.planner import ResearchPlan, TaskStep
from app.schemas.common import StepStatus, ToolType, SessionStatus
from app.schemas.governance import PolicyCheckRequest

logger = get_logger(__name__)


class AgentOrchestrator(IAgentOrchestrator):
    """
    Coordinates task execution, calls governance policies,
    routes to tools, updates short-term memory, and emits streaming events.
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        
        # Lazy imports/instantiations to prevent circular dependencies
        from app.browser.browser_tool import BrowserTool
        from app.sandbox.sandbox import SandboxExecutor
        from app.memory.memory import MemoryService
        from app.governance.governance import GovernanceEngine
        from app.evaluation.evaluation import EvaluationService
        from app.research.services.research_pipeline_service import ResearchPipelineService

        self.browser = BrowserTool(settings=settings)
        self.sandbox = SandboxExecutor(settings=settings)
        self.memory = MemoryService(settings=settings)
        self.governance = GovernanceEngine(settings=settings)
        self.evaluation = EvaluationService(settings=settings)
        self.pipeline_service = ResearchPipelineService(settings=settings)

        logger.info("AgentOrchestrator initialized with active execution logic")

    async def execute_plan(
        self, plan: ResearchPlan, session_id: str
    ) -> AsyncGenerator[dict[str, Any], None]:
        """
        Execute research plan steps sequentially.
        For each step:
        1. Check with Governance Engine.
        2. Emit step_started.
        3. Invoke tool.
        4. Store output in memory.
        5. Emit step_completed/failed.
        """
        logger.info("Starting execution of research plan", session_id=session_id, plan_id=plan.plan_id)

        for step in plan.steps:
            # Check if session is paused or cancelled
            context = await self.memory.get_session_context(session_id)
            if context.get("status") == SessionStatus.PAUSED:
                logger.info("Plan execution paused", session_id=session_id)
                yield {
                    "type": "human_approval_required",
                    "session_id": session_id,
                    "message": "Execution is paused. Awaiting user resume.",
                }
                break

            if context.get("status") == SessionStatus.CANCELLED:
                logger.info("Plan execution cancelled", session_id=session_id)
                break

            # 1. Update step states
            step.status = StepStatus.RUNNING
            step.started_at = datetime.now(timezone.utc)
            await self.memory.update_session_state(session_id, {"current_step": step.title})

            yield {
                "type": "step_started",
                "session_id": session_id,
                "step_id": step.step_id,
                "step_title": step.title,
                "message": f"Starting step: {step.title}",
            }

            # 2. Run Governance checks
            policy_req = PolicyCheckRequest(
                action_type=step.tool,
                action_params=step.parameters or {},
                session_id=session_id,
                step_id=step.step_id,
                context=step.description,
            )

            try:
                verdict = await self.governance.check_action(policy_req)
                if not verdict.allowed:
                    step.status = StepStatus.BLOCKED
                    step.error_message = f"Governance block: {verdict.reason}"
                    step.completed_at = datetime.now(timezone.utc)
                    yield {
                        "type": "step_failed",
                        "session_id": session_id,
                        "step_id": step.step_id,
                        "step_title": step.title,
                        "message": f"Step blocked by governance: {verdict.reason}",
                        "result": {"error": verdict.reason},
                    }
                    if self.settings.GOVERNANCE_STRICT_MODE:
                        logger.warning("Halting plan execution due to governance violation", session_id=session_id)
                        break
                    continue
            except Exception as e:
                logger.exception("Governance validation check failed", session_id=session_id)
                step.status = StepStatus.FAILED
                step.error_message = f"Governance verification failed: {str(e)}"
                step.completed_at = datetime.now(timezone.utc)
                yield {
                    "type": "step_failed",
                    "session_id": session_id,
                    "step_id": step.step_id,
                    "step_title": step.title,
                    "message": f"Governance check failure: {str(e)}",
                    "result": {"error": str(e)},
                }
                break

            # 3. Execute step tool
            try:
                start_time = datetime.now(timezone.utc)
                result = await self.execute_step(step, session_id)
                duration_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)

                # Store status updates
                step.status = StepStatus.COMPLETED
                step.result = result
                step.completed_at = datetime.now(timezone.utc)

                # Update memory trace
                session_context = await self.memory.get_session_context(session_id)
                tool_calls = session_context.get("tool_call_history", [])
                tool_calls.append({
                    "step_id": step.step_id,
                    "tool_used": step.tool,
                    "parameters": step.parameters or {},
                    "result": result,
                    "duration_ms": duration_ms,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })

                findings = session_context.get("findings", [])
                # If we searched, ingest domain snippets into short-term findings list
                if step.tool == ToolType.BROWSER and "results" in result:
                    from app.schemas.research import ResearchFinding, Citation
                    citations = []
                    content_snippets = []
                    for r in result.get("results", []):
                        citations.append(
                            Citation(
                                title=r.get("title", "Web Source"),
                                url=r.get("url", "https://example.com"),
                                source_domain=r.get("source_domain", "example.com"),
                                accessed_at=datetime.now(timezone.utc),
                                excerpt=r.get("content", ""),
                                confidence_score=r.get("relevance_score", 0.8),
                            )
                        )
                        content_snippets.append(r.get("content", ""))

                    findings.append(
                        ResearchFinding(
                            finding_id=f"finding-{step.step_id}",
                            session_id=session_id,
                            iteration=session_context.get("current_iteration", 1),
                            content="\n\n".join(content_snippets) or "No contents returned.",
                            citations=citations,
                            tool_used="browser"
                        )
                    )

                await self.memory.update_session_state(session_id, {
                    "tool_call_history": tool_calls,
                    "findings": findings
                })

                yield {
                    "type": "step_completed",
                    "session_id": session_id,
                    "step_id": step.step_id,
                    "step_title": step.title,
                    "result": result,
                    "message": f"Completed step: {step.title}",
                }

            except Exception as e:
                logger.exception("Step execution raised an unhandled exception", step_id=step.step_id)
                step.status = StepStatus.FAILED
                step.error_message = str(e)
                step.completed_at = datetime.now(timezone.utc)
                yield {
                    "type": "step_failed",
                    "session_id": session_id,
                    "step_id": step.step_id,
                    "step_title": step.title,
                    "message": f"Step failed: {step.title}. Reason: {str(e)}",
                    "result": {"error": str(e)},
                }
                break

    async def execute_step(
        self, step: TaskStep, session_id: str
    ) -> dict[str, Any]:
        """
        Route task step to concrete sub-service.
        """
        logger.info("Executing step tool", tool=step.tool, step_id=step.step_id)

        params = step.parameters or {}

        if step.tool == ToolType.BROWSER:
            query = params.get("query", "")
            max_results = params.get("max_results", 5)
            results = await self.browser.search(query=query, max_results=max_results)
            
            # Ingest results into RAG Vector DB
            for r in results:
                try:
                    await self.pipeline_service.ingest_document(
                        text=r.content,
                        url=r.url,
                        file_name=r.title,
                        metadata={"session_id": session_id, "query": query}
                    )
                except Exception as e:
                    logger.warning("Vector database ingestion failed for source", url=r.url, error=str(e))

            return {"results": [r.model_dump() for r in results]}

        elif step.tool == ToolType.SANDBOX:
            code = params.get("code", "")
            language = params.get("language", "python")
            return await self.sandbox.execute_code(code=code, language=language)

        elif step.tool == ToolType.MEMORY:
            # Short-term vector retrieval or storage query
            query = params.get("query", "")
            if query:
                retrieved = await self.pipeline_service.retrieve_relevant_chunks(
                    query=query,
                    top_k=params.get("top_k", 5),
                    session_id=session_id
                )
                return retrieved.model_dump()
            else:
                content = params.get("content", "")
                meta = params.get("metadata", {})
                doc_id = await self.memory.store(
                    content=content,
                    metadata=meta,
                    session_id=session_id,
                    memory_type=params.get("memory_type", "long_term")
                )
                return {"document_id": doc_id}

        elif step.tool == ToolType.EVALUATION:
            # Perform quality checkpoint evaluation
            context = await self.memory.get_session_context(session_id)
            findings = context.get("findings", [])
            question = context.get("question", "")
            iteration = context.get("current_iteration", 1)

            eval_res = await self.evaluation.evaluate_findings(
                question=question,
                findings=findings,
                session_id=session_id,
                iteration=iteration
            )
            return eval_res.model_dump()

        else:
            logger.warning("Unsupported step tool requested", tool=step.tool)
            return {"status": "unsupported", "message": f"Tool '{step.tool}' has no active router."}

    async def get_agent_state(self, session_id: str) -> dict[str, Any]:
        """
        Get latest runtime state of a session.
        """
        context = await self.memory.get_session_context(session_id)
        return {
            "session_id": session_id,
            "status": context.get("status", "idle"),
            "current_step": context.get("current_step"),
            "iteration": context.get("current_iteration", 0),
        }

    async def pause_execution(self, session_id: str) -> bool:
        """
        Pause running task loop.
        """
        logger.info("Pausing session execution", session_id=session_id)
        await self.memory.update_session_state(session_id, {"status": SessionStatus.PAUSED})
        return True

    async def resume_execution(self, session_id: str) -> bool:
        """
        Resume paused task loop.
        """
        logger.info("Resuming session execution", session_id=session_id)
        await self.memory.update_session_state(session_id, {"status": SessionStatus.RUNNING})
        return True
