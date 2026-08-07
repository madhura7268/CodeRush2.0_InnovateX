"""
Research Pipeline Implementation

Implements: IResearchPipeline
"""

import uuid
import asyncio
from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from typing import Any

from app.config.settings import Settings
from app.core.logging import get_logger
from app.interfaces.research import IResearchPipeline
from app.interfaces.planner import IPlanner
from app.interfaces.orchestrator import IAgentOrchestrator
from app.interfaces.evaluation import IEvaluation
from app.interfaces.governance import IGovernanceEngine
from app.interfaces.memory import IMemory
from app.interfaces.report import IReportGenerator
from app.websocket.manager import WebSocketManager
from app.schemas.common import SessionStatus
from app.schemas.research import ResearchRequest, ResearchResult, ResearchSessionStatus, ResearchHistoryItem

logger = get_logger(__name__)

# Global in-memory session store
_sessions: dict[str, dict[str, Any]] = {}


class ResearchPipeline(IResearchPipeline):
    """
    Coordinates end-to-end research session life-cycle:
    Planning -> Execution (Orchestrator) -> Evaluation -> Adaptation -> Reporting
    """

    def __init__(
        self,
        settings: Settings,
        planner: IPlanner,
        orchestrator: IAgentOrchestrator,
        evaluation: IEvaluation,
        governance: IGovernanceEngine,
        memory: IMemory,
        report_generator: IReportGenerator,
        ws_manager: WebSocketManager,
    ) -> None:
        self.settings = settings
        self.planner = planner
        self.orchestrator = orchestrator
        self.evaluation = evaluation
        self.governance = governance
        self.memory = memory
        self.report_generator = report_generator
        self.ws_manager = ws_manager
        logger.info("ResearchPipeline fully initialized with active sub-services")

    async def get_history(self) -> list[ResearchHistoryItem]:
        """
        Retrieve history of all research sessions.
        """
        history = []
        for session_id, session in _sessions.items():
            context = await self.memory.get_session_context(session_id)
            overall_confidence = context.get("overall_confidence", 0.0) * 100.0

            # Count unique sources from citations in findings
            citations = []
            for finding in context.get("findings", []):
                citations.extend(finding.citations)
            unique_urls = {c.url for c in citations}
            sources_count = len(unique_urls)

            history.append(
                ResearchHistoryItem(
                    session_id=session_id,
                    question=session["question"],
                    date=session["created_at"].strftime("%Y-%m-%d %H:%M"),
                    status=session["status"],
                    iterations=session["current_iteration"],
                    sources_count=sources_count,
                    overall_confidence=overall_confidence,
                    tags=session.get("tags", []),
                )
            )
        # Sort by date descending
        history.sort(key=lambda x: x.date, reverse=True)
        return history

    async def start_research(self, request: ResearchRequest) -> str:
        """
        Start an autonomous research session asynchronously.
        """
        session_id = str(uuid.uuid4())
        
        # 1. Initialize session info
        _sessions[session_id] = {
            "session_id": session_id,
            "status": SessionStatus.PENDING,
            "question": request.question,
            "current_iteration": 0,
            "max_iterations": request.max_iterations or self.settings.MAX_RESEARCH_ITERATIONS,
            "confidence_threshold": request.confidence_threshold or self.settings.EVALUATION_CONFIDENCE_THRESHOLD,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "current_step": None,
            "tags": request.tags or [],
        }

        # 2. Store session details in memory
        await self.memory.update_session_state(session_id, {
            "session_id": session_id,
            "question": request.question,
            "status": SessionStatus.PENDING,
            "findings": [],
            "tool_call_history": [],
            "overall_confidence": 0.0,
            "total_iterations": 0,
        })

        logger.info("Created research session", session_id=session_id)

        # 3. Spawn background execution task
        asyncio.create_task(self._run_research_loop(session_id))

        return session_id

    async def _run_research_loop(self, session_id: str) -> None:
        """
        Background task running the full iterative research loop.
        """
        logger.info("Background research loop started", session_id=session_id)
        try:
            # 1. Planning phase
            await self._update_status(session_id, SessionStatus.PLANNING)
            await self.ws_manager.broadcast(session_id, {
                "type": "session_started",
                "session_id": session_id,
                "message": f"Planning research strategy for topic: '{_sessions[session_id]['question']}'",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "session_status": self._session_status_snapshot(session_id),
            })

            question = _sessions[session_id]["question"]
            plan = await self.planner.generate_plan(question, session_id)
            
            iteration = 1
            max_iterations = _sessions[session_id]["max_iterations"]
            confidence_threshold = _sessions[session_id]["confidence_threshold"]

            # 2. Iteration loop
            while iteration <= max_iterations:
                # Check cancellation/pause state
                if _sessions[session_id]["status"] == SessionStatus.CANCELLED:
                    logger.info("Research loop halted: session cancelled", session_id=session_id)
                    return

                await self._update_status(session_id, SessionStatus.RUNNING, iteration=iteration)
                logger.info("Starting research loop iteration", session_id=session_id, iteration=iteration)

                # Execute steps via Orchestrator
                async for event in self.orchestrator.execute_plan(plan, session_id):
                    # Propagate progress event
                    event["timestamp"] = datetime.now(timezone.utc).isoformat()
                    # Also update current step title in session store
                    if event.get("type") == "step_started":
                        _sessions[session_id]["current_step"] = event.get("step_title")
                    # Embed session snapshot so frontend WS path can update WorkflowTimeline immediately
                    event["session_status"] = self._session_status_snapshot(session_id)
                    await self.ws_manager.broadcast(session_id, event)

                # Re-check cancellation/pause state
                if _sessions[session_id]["status"] == SessionStatus.CANCELLED:
                    logger.info("Research loop halted: session cancelled after orchestrator", session_id=session_id)
                    return

                # 3. Quality evaluation phase
                await self._update_status(session_id, SessionStatus.EVALUATING)
                context = await self.memory.get_session_context(session_id)
                findings = context.get("findings", [])

                eval_result = await self.evaluation.evaluate_findings(
                    question=question,
                    findings=findings,
                    session_id=session_id,
                    iteration=iteration
                )

                # Cache confidence percentage in _sessions dict BEFORE broadcasting so
                # _session_status_snapshot() includes the real evaluator score immediately.
                # eval_result.overall_confidence is in 0-1 scale from the evaluator.
                if session_id in _sessions:
                    _sessions[session_id]["overall_confidence_pct"] = eval_result.overall_confidence * 100.0

                # Broadcast evaluation result (snapshot now has real confidence score)
                await self.ws_manager.broadcast(session_id, {
                    "type": "iteration_evaluated",
                    "session_id": session_id,
                    "message": f"Iteration {iteration} evaluated. Current overall confidence: {eval_result.overall_confidence*100:.1f}%",
                    "result": eval_result.model_dump(),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "session_status": self._session_status_snapshot(session_id),
                })

                # Persist evaluation metrics in session context (0-1 scale stored in memory)
                await self.memory.update_session_state(session_id, {
                    "overall_confidence": eval_result.overall_confidence,
                    "total_iterations": iteration,
                    "quality_metrics": {d.dimension: d.score for d in eval_result.dimension_scores}
                })

                # Check stopping conditions
                if eval_result.overall_confidence >= confidence_threshold:
                    logger.info("Research finished: confidence threshold reached", session_id=session_id, confidence=eval_result.overall_confidence)
                    break

                if not eval_result.should_continue:
                    logger.info("Research finished: evaluator recommended to stop", session_id=session_id)
                    break

                if iteration >= max_iterations:
                    logger.info("Research finished: maximum iteration limit reached", session_id=session_id)
                    break

                # Adapt plan for next iteration
                await self._update_status(session_id, SessionStatus.PLANNING)
                plan = await self.planner.adapt_plan(plan, plan.steps, iteration + 1)
                iteration += 1

            # 4. Synthesize final structured report
            await self._update_status(session_id, SessionStatus.COMPLETED)
            await self.report_generator.generate_report(session_id)

            await self.ws_manager.broadcast(session_id, {
                "type": "session_completed",
                "session_id": session_id,
                "message": "Autonomous research workflow completed successfully. Synthesized final report.",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "session_status": self._session_status_snapshot(session_id),
            })

        except Exception as e:
            logger.exception("Error encountered during background research execution", session_id=session_id)
            await self._update_status(session_id, SessionStatus.FAILED)
            await self.ws_manager.broadcast(session_id, {
                "type": "session_failed",
                "session_id": session_id,
                "message": f"Critical error in research execution loop: {str(e)}",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "session_status": self._session_status_snapshot(session_id),
            })

    async def _update_status(self, session_id: str, status: SessionStatus, iteration: int | None = None) -> None:
        """Helper to update internal session state and context memory."""
        if session_id in _sessions:
            _sessions[session_id]["status"] = status
            _sessions[session_id]["updated_at"] = datetime.now(timezone.utc)
            if iteration is not None:
                _sessions[session_id]["current_iteration"] = iteration
            
            await self.memory.update_session_state(session_id, {
                "status": status,
                "current_iteration": _sessions[session_id]["current_iteration"]
            })

    def _session_status_snapshot(self, session_id: str) -> dict:
        """Return a lightweight session status dict suitable for embedding in WS events."""
        if session_id not in _sessions:
            return {}
        s = _sessions[session_id]
        curr = s["current_iteration"]
        total = s["max_iterations"]
        status = s["status"]
        if status == SessionStatus.COMPLETED:
            progress = 100.0
        elif status in (SessionStatus.FAILED, SessionStatus.CANCELLED):
            progress = 100.0
        else:
            progress = min(99.0, (curr / max(total, 1)) * 100.0)
        # Read the live evaluator confidence score (stored as 0-1 float, exposed as 0-100 percentage)
        overall_confidence_pct = s.get("overall_confidence_pct", 0.0)
        return {
            "session_id": session_id,
            "status": status,
            "question": s["question"],
            "current_iteration": curr,
            "max_iterations": total,
            "confidence_threshold": s["confidence_threshold"],
            "overall_confidence": overall_confidence_pct,
            "current_step": s.get("current_step"),
            "progress_percentage": progress,
            "created_at": s["created_at"].isoformat(),
            "updated_at": s["updated_at"].isoformat(),
        }

    async def get_session_status(self, session_id: str) -> ResearchSessionStatus:
        """
        Retrieve research session status details.
        """
        if session_id not in _sessions:
            from app.core.exceptions import ResourceNotFoundException
            raise ResourceNotFoundException("ResearchSession", session_id)

        session = _sessions[session_id]
        status = session["status"]

        # Dynamically calculate progress percentage
        if status == SessionStatus.COMPLETED:
            progress = 100.0
        elif status in (SessionStatus.FAILED, SessionStatus.CANCELLED):
            progress = 100.0
        else:
            curr = session["current_iteration"]
            total = session["max_iterations"]
            progress = min(99.0, (curr / max(total, 1)) * 100.0)

        # Fetch the real evaluator confidence score (stored as 0-1, convert to 0-100)
        context = await self.memory.get_session_context(session_id)
        overall_confidence_pct = context.get("overall_confidence", 0.0) * 100.0

        return ResearchSessionStatus(
            session_id=session_id,
            status=status,
            question=session["question"],
            current_iteration=session["current_iteration"],
            max_iterations=session["max_iterations"],
            confidence_threshold=session["confidence_threshold"],
            overall_confidence=overall_confidence_pct,
            progress_percentage=progress,
            current_step=session.get("current_step"),
            created_at=session["created_at"],
            updated_at=session["updated_at"],
        )

    async def get_result(self, session_id: str) -> ResearchResult:
        """
        Compile research session findings result.
        """
        if session_id not in _sessions:
            from app.core.exceptions import ResourceNotFoundException
            raise ResourceNotFoundException("ResearchSession", session_id)

        session = _sessions[session_id]
        context = await self.memory.get_session_context(session_id)

        return ResearchResult(
            session_id=session_id,
            question=session["question"],
            status=session["status"],
            findings=context.get("findings", []),
            total_iterations=session["current_iteration"],
            overall_confidence=context.get("overall_confidence", 0.0) * 100.0,
            report_id=f"report-{session_id}" if session["status"] == SessionStatus.COMPLETED else None,
            completed_at=session["updated_at"] if session["status"] in (SessionStatus.COMPLETED, SessionStatus.FAILED) else None,
        )

    async def stream_progress(self, session_id: str) -> AsyncGenerator[dict, None]:
        """
        Stream placeholder connection status event.
        """
        yield {"type": "info", "message": "WebSocket streaming active."}

    async def cancel_session(self, session_id: str) -> bool:
        """
        Mark research session as cancelled.
        """
        if session_id in _sessions:
            await self._update_status(session_id, SessionStatus.CANCELLED)
            await self.ws_manager.broadcast(session_id, {
                "type": "session_failed",
                "session_id": session_id,
                "message": "Research session cancelled by operator.",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            return True
        return False
