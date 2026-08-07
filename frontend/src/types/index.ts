/**
 * TypeScript type definitions for the Research Agent frontend.
 *
 * These types mirror the Pydantic schemas in the backend.
 * When the backend schemas change, update these types accordingly.
 */

// ============================================================================
// Common
// ============================================================================
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

export type ToolType = 'browser' | 'sandbox' | 'memory' | 'evaluation' | 'planner'

// ============================================================================
// Research
// ============================================================================
export interface ResearchRequest {
  question: string
  max_iterations?: number
  confidence_threshold?: number
  enable_sandbox?: boolean
  tags?: string[]
}

export interface ResearchSessionStatus {
  session_id: string
  status: SessionStatus
  question: string
  current_iteration: number
  max_iterations: number
  current_step: string | null
  progress_percentage: number
  created_at: string
  updated_at: string
  estimated_completion: string | null
}

export interface Citation {
  title: string
  url: string
  source_domain: string
  accessed_at: string
  excerpt: string | null
  relevance_score: number
}

export interface ResearchFinding {
  finding_id: string
  session_id: string
  iteration: number
  content: string
  citations: Citation[]
  tool_used: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface ResearchResult {
  session_id: string
  question: string
  status: SessionStatus
  findings: ResearchFinding[]
  total_iterations: number
  overall_confidence: number
  report_id: string | null
  completed_at: string | null
}

// ============================================================================
// Planner
// ============================================================================
export interface TaskStep {
  step_id: string
  order: number
  title: string
  description: string
  tool: ToolType
  parameters: Record<string, unknown>
  dependencies: string[]
  success_criteria: string
  status: StepStatus
  result: Record<string, unknown> | null
  started_at: string | null
  completed_at: string | null
  error_message: string | null
}

export interface ResearchPlan {
  plan_id: string
  session_id: string
  question: string
  objective: string
  steps: TaskStep[]
  iteration: number
  rationale: string
  estimated_duration_minutes: number | null
  created_at: string
}

// ============================================================================
// Governance
// ============================================================================
export type PolicyVerdict = 'allow' | 'block' | 'warn'

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
// Evaluation
// ============================================================================
export interface DimensionScore {
  dimension: string
  score: number
  reasoning: string
}

export interface EvaluationResult {
  evaluation_id: string
  session_id: string
  iteration: number
  overall_confidence: number
  dimension_scores: DimensionScore[]
  should_continue: boolean
  improvement_suggestions: string[]
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
// Report
// ============================================================================
export interface StructuredReport {
  report_id: string
  session_id: string
  question: string
  executive_summary: string
  sections: ReportSection[]
  all_citations: Citation[]
  overall_confidence: number
  quality_metrics: Record<string, number>
  methodology: string
  total_iterations: number
  limitations: string[]
  generated_at: string
}

export interface ReportSection {
  title: string
  content: string
  citations: Citation[]
  order: number
}

// ============================================================================
// WebSocket Events
// ============================================================================
export type WebSocketEventType =
  | 'session_started'
  | 'step_started'
  | 'step_completed'
  | 'step_failed'
  | 'iteration_evaluated'
  | 'session_completed'
  | 'session_failed'
  | 'placeholder'

export interface WebSocketEvent {
  type: WebSocketEventType
  session_id: string
  step_id?: string
  step_title?: string
  message: string
  result?: Record<string, unknown>
  timestamp?: string
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
