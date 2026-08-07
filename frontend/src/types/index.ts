/**
 * TypeScript type definitions for the Research Agent frontend.
 *
 * Extended to cover all AE-02 frontend visualization features:
 * - Research Requests & Configurations
 * - Planner & Task Execution
 * - Workflow Nodes & Graph State
 * - Sources & Document Reliability
 * - RAG Information & Retrieval Chunks
 * - Confidence Breakdown & Evaluation Results
 * - Self-Improvement Iteration Evolution
 * - Governance Policies & Audit Logs
 * - Sandbox Execution & Metrics
 * - Human-in-the-Loop Approval Requests
 * - Structured Final Research Report
 * - Session History & Live Log Events
 */

// ============================================================================
// System Status & Core Enums
// ============================================================================

export type SystemStatus = 'Online' | 'Researching' | 'Completed' | 'Paused' | 'Error'

export type SessionStatus =
  | 'pending'
  | 'planning'
  | 'running'
  | 'paused'
  | 'evaluating'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type StepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'blocked'

export type ToolType = 'browser' | 'sandbox' | 'memory' | 'evaluation' | 'planner' | 'rag' | 'analyzer'

export type ResearchDepth = 'standard' | 'deep' | 'exhaustive'

// ============================================================================
// Configuration & Requests
// ============================================================================

export interface ResearchConfig {
  max_iterations: number
  confidence_threshold: number
  research_depth: ResearchDepth
  enable_web_search: boolean
  enable_browser: boolean
  enable_rag: boolean
  enable_sandbox: boolean
}

export interface ResearchRequest extends Partial<ResearchConfig> {
  question: string
  tags?: string[]
}

export interface ResearchSessionStatus {
  session_id: string
  status: SessionStatus
  question: string
  current_iteration: number
  max_iterations: number
  confidence_threshold: number
  overall_confidence: number  // real evaluator score as percentage (0-100)
  current_step: string | null
  progress_percentage: number
  created_at: string
  updated_at: string
  estimated_completion: string | null
}

// ============================================================================
// Sources & RAG Information
// ============================================================================

export type SourceType =
  | 'Research Paper'
  | 'Government'
  | 'Documentation'
  | 'News'
  | 'Website'
  | 'Report'

export type VerificationStatus = 'Verified' | 'Unverified' | 'Flawed' | 'Flagged'

export interface SourceItem {
  id: string
  title: string
  url: string
  domain: string
  source_type: SourceType
  relevance_score: number // 0 - 100 or 0 - 1
  evidence_score: number // 0 - 100 or 0 - 1
  verification_status: VerificationStatus
  accessed_at: string
  excerpt: string
  authors?: string[]
  publication_date?: string
}

export interface Citation {
  title: string
  url: string
  source_domain: string
  accessed_at: string
  excerpt: string | null
  relevance_score: number
}

export interface RAGChunk {
  chunk_id: string
  document_name: string
  document_type: string
  content: string
  similarity_score: number // e.g. 0.91
  metadata: Record<string, unknown>
}

export interface RAGResult {
  documents_retrieved: number
  chunks_retrieved: number
  top_chunks: RAGChunk[]
  retrieval_time_ms: number
}

// ============================================================================
// Confidence & Evaluation
// ============================================================================

export interface ConfidenceBreakdown {
  source_quality: number // 0 - 100
  evidence_coverage: number // 0 - 100
  cross_source_consistency: number // 0 - 100
  relevance: number // 0 - 100
  validation: number // 0 - 100
}

export interface DimensionScore {
  dimension: string
  score: number
  reasoning: string
}

export type EvaluationDecision = 'REPORT' | 'IMPROVE'

export interface EvaluationResult {
  evaluation_id: string
  session_id: string
  iteration: number
  overall_confidence: number // percentage e.g. 86.5
  breakdown: ConfidenceBreakdown
  strengths: string[]
  weaknesses: string[]
  recommendation: string
  decision: EvaluationDecision
  evaluated_at: string
}

export interface IterationEvaluation {
  iteration: number
  overall_confidence: number
  dimension_scores: Record<string, number>
  should_continue: boolean
  evaluated_at: string
}

// ============================================================================
// Self-Improvement & Strategy Evolution
// ============================================================================

export interface SelfImprovementIteration {
  iteration: number
  confidence: number // percentage
  problems_detected: string[]
  action_taken: string
  previous_strategy: string
  strategy_change: string
  new_strategy: string
  result_summary: string
  status: 'Improved' | 'Iterating' | 'Threshold Reached'
}

// ============================================================================
// Planner & Workflow Graph
// ============================================================================

export interface TaskStep {
  step_id: string
  order: number
  title: string
  description: string
  tool: ToolType
  parameters?: Record<string, unknown>
  dependencies: string[]
  success_criteria: string
  status: StepStatus
  result?: Record<string, unknown> | null
  started_at?: string | null
  completed_at?: string | null
  error_message?: string | null
}

export interface ResearchPlan {
  plan_id: string
  session_id: string
  question: string
  objective: string
  steps: TaskStep[]
  iteration: number
  rationale: string
  estimated_duration_minutes?: number | null
  created_at: string
}

export type WorkflowNodeId =
  | 'START'
  | 'PLANNER'
  | 'RESEARCH'
  | 'BROWSER_SEARCH'
  | 'RAG'
  | 'ANALYZER'
  | 'EVALUATOR'
  | 'CONFIDENCE_CHECK'
  | 'IMPROVE_STRATEGY'
  | 'REPORT'

export interface WorkflowNode {
  id: WorkflowNodeId
  label: string
  description: string
  status: StepStatus
  active_iteration?: number
  metrics?: string
}

// ============================================================================
// Governance & Safety
// ============================================================================

export type PolicyVerdict = 'allow' | 'block' | 'warn'

export type GovernanceAction =
  | 'web_search'
  | 'browser_automation'
  | 'rag_retrieval'
  | 'sandbox_execution'
  | 'file_access'
  | 'system_commands'
  | 'external_action'

export interface GovernancePermission {
  action: GovernanceAction
  label: string
  status: 'ALLOWED' | 'BLOCKED' | 'HUMAN APPROVAL'
  description: string
}

export interface PolicyCheckResult {
  allowed: boolean
  verdict: PolicyVerdict
  matched_policies: string[]
  reason: string
  warnings: string[]
  checked_at: string
}

export interface AuditLogEntry {
  log_id: string
  session_id: string
  step_id: string | null
  action_type: string
  action_params: Record<string, unknown>
  verdict: PolicyVerdict
  matched_policies: string[]
  reason: string
  timestamp: string
}

// ============================================================================
// Human in the Loop (HITL)
// ============================================================================

export interface HumanApprovalRequest {
  request_id: string
  session_id: string
  action: string
  reason: string
  details?: Record<string, unknown>
  requested_at: string
  status: 'pending' | 'approved' | 'rejected'
}

// ============================================================================
// Sandbox Execution
// ============================================================================

export interface SandboxExecution {
  execution_id: string
  session_id: string
  task_name: string
  status: 'Idle' | 'Running' | 'Completed' | 'Failed'
  execution_time_seconds: number
  memory_mb: number
  cpu_percent: number
  network_status: 'Restricted' | 'Allowed' | 'Isolated'
  command: string
  logs: string[]
}

// ============================================================================
// Structured Report
// ============================================================================

export interface ReportSection {
  title: string
  content: string
  citations: Citation[]
  order: number
}

export interface StructuredReport {
  report_id: string
  session_id: string
  question: string
  executive_summary: string
  methodology: string
  key_findings: string[]
  evidence: string
  sections: ReportSection[]
  sources: SourceItem[]
  citations: Citation[]
  overall_confidence: number
  limitations: string[]
  recommendations: string[]
  total_iterations: number
  generated_at: string
}

// ============================================================================
// Research History
// ============================================================================

export interface ResearchHistoryItem {
  session_id: string
  question: string
  date: string
  status: SessionStatus
  iterations: number
  sources_count: number
  overall_confidence: number // percentage
  tags?: string[]
}

// ============================================================================
// Activity Events & WebSocket
// ============================================================================

export type EventLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'RUNNING'

export interface ActivityEvent {
  id: string
  session_id: string
  timestamp: string
  level: EventLevel
  message: string
  node?: WorkflowNodeId
  details?: Record<string, unknown>
}

export type WebSocketEventType =
  | 'session_started'
  | 'step_started'
  | 'step_completed'
  | 'step_failed'
  | 'iteration_evaluated'
  | 'human_approval_required'
  | 'session_completed'
  | 'session_failed'

export interface WebSocketEvent {
  type: WebSocketEventType
  session_id: string
  step_id?: string
  step_title?: string
  message: string
  result?: Record<string, unknown>
  timestamp?: string
  level?: EventLevel
  /** Full or partial session status snapshot, when the backend includes it in the event payload. */
  session_status?: ResearchSessionStatus
}

// ============================================================================
// Health
// ============================================================================

export interface HealthStatus {
  status: string
  version: string
  environment: string
  timestamp: string
  services: Record<string, string>
}
