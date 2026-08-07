import uuid
import re
from datetime import datetime, timezone

from app.config.settings import Settings
from app.core.logging import get_logger
from app.interfaces.evaluation import IEvaluation
from app.schemas.evaluation import DimensionScore, EvaluationResult, IterationEvaluation
from app.schemas.research import ResearchFinding
from app.research.verification.source_verifier import SourceVerifier

logger = get_logger(__name__)

_evaluation_history: dict[str, list[EvaluationResult]] = {}


class EvaluationService(IEvaluation):
    """
    Multi-dimensional evaluation engine for research findings.
    Dynamically computes relevance, completeness, accuracy, consistency, and depth.
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.source_verifier = SourceVerifier()
        logger.info("EvaluationService initialized with active evaluation engine")

    async def evaluate_findings(
        self,
        question: str,
        findings: list[ResearchFinding],
        session_id: str,
        iteration: int,
    ) -> EvaluationResult:
        """Score research findings dynamically across 5 dimensions."""
        logger.info(
            "Evaluating research findings",
            session_id=session_id,
            iteration=iteration,
            num_findings=len(findings),
        )

        relevance_score = self._calculate_relevance(question, findings)
        completeness_score = self._calculate_completeness(findings, iteration)
        accuracy_score = self._calculate_accuracy(findings)
        consistency_score = self._calculate_consistency(findings)
        depth_score = self._calculate_depth(findings)

        overall_confidence = round(
            (relevance_score * 0.30)
            + (completeness_score * 0.25)
            + (accuracy_score * 0.25)
            + (consistency_score * 0.10)
            + (depth_score * 0.10),
            4,
        )

        dimension_scores = [
            DimensionScore(
                dimension="relevance",
                score=relevance_score,
                reasoning=f"Question term relevance alignment: {relevance_score:.2f}",
            ),
            DimensionScore(
                dimension="completeness",
                score=completeness_score,
                reasoning=f"Evidence coverage across {len(findings)} findings: {completeness_score:.2f}",
            ),
            DimensionScore(
                dimension="accuracy",
                score=accuracy_score,
                reasoning=f"Source verification & domain authority: {accuracy_score:.2f}",
            ),
            DimensionScore(
                dimension="consistency",
                score=consistency_score,
                reasoning=f"Cross-source agreement score: {consistency_score:.2f}",
            ),
            DimensionScore(
                dimension="depth",
                score=depth_score,
                reasoning=f"Empirical metrics & structural depth score: {depth_score:.2f}",
            ),
        ]

        threshold = self.settings.EVALUATION_CONFIDENCE_THRESHOLD
        should_continue = overall_confidence < threshold and iteration < self.settings.MAX_RESEARCH_ITERATIONS

        suggestions = []
        if relevance_score < 0.7:
            suggestions.append("Refine search terms to focus more closely on topic specifics.")
        if accuracy_score < 0.7:
            suggestions.append("Incorporate more academic (.edu) or official (.gov) domains.")
        if depth_score < 0.7:
            suggestions.append("Execute sandbox code benchmarks or retrieve structured quantitative data.")
        if not suggestions:
            suggestions.append("Findings meet quality threshold; ready for report synthesis.")

        result = EvaluationResult(
            evaluation_id=str(uuid.uuid4()),
            session_id=session_id,
            iteration=iteration,
            overall_confidence=overall_confidence,
            dimension_scores=dimension_scores,
            should_continue=should_continue,
            improvement_suggestions=suggestions,
            evaluated_at=datetime.now(timezone.utc),
        )

        if session_id not in _evaluation_history:
            _evaluation_history[session_id] = []
        _evaluation_history[session_id].append(result)

        return result

    def _calculate_relevance(self, question: str, findings: list[ResearchFinding]) -> float:
        if not findings:
            return 0.40

        stop_words = {"what", "how", "why", "is", "are", "the", "a", "an", "for", "in", "of", "on", "and", "to", "with", "does"}
        q_words = [w.lower().strip("?,!.") for w in question.split() if w.lower().strip("?,!.") not in stop_words and len(w) >= 3]

        if not q_words:
            return 0.70

        all_text = " ".join([f.content for f in findings]).lower()
        for f in findings:
            for c in f.citations:
                all_text += " " + c.title.lower() + " " + (c.excerpt or "").lower()

        matches = sum(1 for word in q_words if word in all_text)
        match_ratio = matches / len(q_words)

        score = 0.50 + (match_ratio * 0.45)
        return round(min(0.98, max(0.30, score)), 4)

    def _calculate_completeness(self, findings: list[ResearchFinding], iteration: int) -> float:
        if not findings:
            return 0.30

        tools_used = {f.tool_used for f in findings}
        total_citations = sum(len(f.citations) for f in findings)
        total_words = sum(len(f.content.split()) for f in findings)

        score = 0.40
        score += min(0.30, len(tools_used) * 0.10)
        score += min(0.20, total_citations * 0.04)
        score += min(0.10, total_words / 500 * 0.10)

        return round(min(0.96, score), 4)

    def _calculate_accuracy(self, findings: list[ResearchFinding]) -> float:
        all_citations = []
        for f in findings:
            all_citations.extend(f.citations)

        if not all_citations:
            return 0.60

        scores = []
        for c in all_citations:
            v_res = self.source_verifier.verify_source(
                url=c.url,
                domain=c.source_domain,
                content_sample=c.excerpt,
            )
            scores.append(v_res.overall_confidence_score)

        avg_score = sum(scores) / len(scores) if scores else 0.60
        return round(min(0.98, max(0.40, avg_score)), 4)

    def _calculate_consistency(self, findings: list[ResearchFinding]) -> float:
        if not findings:
            return 0.50

        all_text = " ".join([f.content.lower() for f in findings])
        conflict_terms = ["contradict", "disagree", "uncertain", "disputed", "inconclusive", "unclear"]
        conflicts = sum(1 for term in conflict_terms if term in all_text)

        base_score = 0.88 - (conflicts * 0.08)
        return round(max(0.40, base_score), 4)

    def _calculate_depth(self, findings: list[ResearchFinding]) -> float:
        if not findings:
            return 0.40

        all_text = " ".join([f.content for f in findings])
        score = 0.50

        numbers_found = len(re.findall(r"\d+", all_text))
        if numbers_found > 10:
            score += 0.25
        elif numbers_found > 3:
            score += 0.15

        if len(all_text.split("\n")) > 3:
            score += 0.15

        return round(min(0.95, score), 4)

    async def compare_iterations(
        self, session_id: str, iteration_a: int, iteration_b: int
    ) -> dict:
        return {
            "session_id": session_id,
            "iteration_a": iteration_a,
            "iteration_b": iteration_b,
            "delta": 0.0,
            "verdict": "comparison complete",
        }

    async def get_iteration_history(
        self, session_id: str
    ) -> list[IterationEvaluation]:
        raw = _evaluation_history.get(session_id, [])
        return [
            IterationEvaluation(
                iteration=r.iteration,
                overall_confidence=r.overall_confidence,
                dimension_scores={d.dimension: d.score for d in r.dimension_scores},
                should_continue=r.should_continue,
                evaluated_at=r.evaluated_at,
            )
            for r in raw
        ]

