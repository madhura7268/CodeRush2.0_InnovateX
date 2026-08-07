/**
 * ResearchPlan Page — Visualizes the autonomous research plan and step execution.
 *
 * Displays:
 * - Research question and objective
 * - Step-by-step timeline with status indicators
 * - Tool labels for each step
 * - Live step progress animation
 */

import { useParams } from 'react-router-dom'
import {
  Search,
  Database,
  Terminal,
  BarChart2,
  Brain,
  CheckCircle2,
  Clock,
  XCircle,
  MinusCircle,
  Loader2,
} from 'lucide-react'
import type { StepStatus, ToolType } from '@/types'
import clsx from 'clsx'

// ---------------------------------------------------------------------------
// Mock plan data — replace with real API data via usePlan hook
// ---------------------------------------------------------------------------
const MOCK_PLAN = {
  plan_id: 'plan-001',
  session_id: 'sess-002',
  question: 'How does CRISPR-Cas9 compare to base editing techniques?',
  objective: 'Systematically compare CRISPR-Cas9 and base editing across accuracy, efficiency, and clinical adoption.',
  iteration: 1,
  rationale: 'Multi-step approach: initial broad search → deep dive per topic → sandbox data analysis → evaluation.',
  steps: [
    {
      step_id: 'step-1', order: 1, title: 'Initial Web Search', tool: 'browser' as ToolType,
      description: 'Search for recent papers and reviews comparing CRISPR-Cas9 and base editing.',
      status: 'completed' as StepStatus, dependencies: [],
      success_criteria: 'At least 10 relevant sources found.',
    },
    {
      step_id: 'step-2', order: 2, title: 'Deep Dive: CRISPR Accuracy', tool: 'browser' as ToolType,
      description: 'Retrieve detailed data on CRISPR-Cas9 on/off-target ratios.',
      status: 'completed' as StepStatus, dependencies: ['step-1'],
      success_criteria: 'Quantitative accuracy metrics collected.',
    },
    {
      step_id: 'step-3', order: 3, title: 'Store Findings', tool: 'memory' as ToolType,
      description: 'Embed and store all collected research in the vector database.',
      status: 'running' as StepStatus, dependencies: ['step-2'],
      success_criteria: 'All documents embedded.',
    },
    {
      step_id: 'step-4', order: 4, title: 'Data Analysis Script', tool: 'sandbox' as ToolType,
      description: 'Run Python script to normalize and compare accuracy metrics.',
      status: 'pending' as StepStatus, dependencies: ['step-3'],
      success_criteria: 'Statistical comparison output generated.',
    },
    {
      step_id: 'step-5', order: 5, title: 'Evaluate Findings', tool: 'evaluation' as ToolType,
      description: 'Score research quality and decide whether to iterate.',
      status: 'pending' as StepStatus, dependencies: ['step-4'],
      success_criteria: 'Confidence score ≥ 75%.',
    },
  ],
}

// ---------------------------------------------------------------------------
// Helper: Step status icon
// ---------------------------------------------------------------------------
function StepIcon({ status }: { status: StepStatus }) {
  const props = { size: 18, className: 'flex-shrink-0' }
  switch (status) {
    case 'completed': return <CheckCircle2 {...props} className="text-emerald-400 flex-shrink-0" />
    case 'running':   return <Loader2 {...props} className="text-brand-400 animate-spin flex-shrink-0" />
    case 'failed':    return <XCircle {...props} className="text-red-400 flex-shrink-0" />
    case 'skipped':   return <MinusCircle {...props} className="text-slate-500 flex-shrink-0" />
    default:          return <Clock {...props} className="text-slate-600 flex-shrink-0" />
  }
}

// Helper: Tool icon
const TOOL_ICONS: Record<ToolType, typeof Search> = {
  browser:    Search,
  memory:     Database,
  sandbox:    Terminal,
  evaluation: BarChart2,
  planner:    Brain,
}

const TOOL_COLORS: Record<ToolType, string> = {
  browser:    'text-accent-400 bg-cyan-950/60 border-cyan-800/40',
  memory:     'text-purple-400 bg-purple-950/60 border-purple-800/40',
  sandbox:    'text-orange-400 bg-orange-950/60 border-orange-800/40',
  evaluation: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40',
  planner:    'text-brand-400 bg-brand-950/60 border-brand-800/40',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ResearchPlanPage() {
  const { sessionId } = useParams()
  const plan = MOCK_PLAN // TODO: replace with usePlan(sessionId)
  const completedSteps = plan.steps.filter(s => s.status === 'completed').length
  const progress = Math.round((completedSteps / plan.steps.length) * 100)

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ---- Header ---- */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Research <span className="text-gradient">Plan</span>
        </h1>
        <p className="text-sm text-muted mt-1">
          Session: {sessionId ?? plan.session_id} · Iteration {plan.iteration}
        </p>
      </div>

      {/* ---- Plan Overview ---- */}
      <div className="card-glass p-6 space-y-4">
        <div>
          <p className="text-xs text-muted uppercase tracking-wide mb-1">Research Question</p>
          <p className="text-base font-semibold text-white">{plan.question}</p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wide mb-1">Objective</p>
          <p className="text-sm text-slate-300">{plan.objective}</p>
        </div>
        {/* Progress bar */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-xs text-muted">Progress</p>
            <p className="text-xs font-semibold text-brand-300">{progress}%</p>
          </div>
          <div className="h-1.5 rounded-full bg-surface-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #4f46e5, #06b6d4)',
              }}
            />
          </div>
        </div>
      </div>

      {/* ---- Step Timeline ---- */}
      <div className="card-glass p-6">
        <h2 className="text-sm font-semibold text-white mb-5">Execution Timeline</h2>
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-[22px] top-4 bottom-4 w-px bg-white/5" />

          <div className="space-y-4">
            {plan.steps.map((step, idx) => {
              const ToolIcon = TOOL_ICONS[step.tool]
              const toolColor = TOOL_COLORS[step.tool]
              const isActive = step.status === 'running'

              return (
                <div
                  key={step.step_id}
                  id={`step-${step.step_id}`}
                  className={clsx(
                    'flex gap-4 items-start p-4 rounded-xl border transition-all duration-300',
                    isActive
                      ? 'bg-brand-950/30 border-brand-700/40 shadow-glow-brand'
                      : 'border-white/5 hover:bg-white/3'
                  )}
                >
                  {/* Step number / status */}
                  <div className="flex flex-col items-center gap-1 mt-0.5 z-10">
                    <StepIcon status={step.status} />
                    {idx < plan.steps.length - 1 && (
                      <span className="text-[10px] text-subtle">{step.order}</span>
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={clsx(
                        'text-sm font-semibold',
                        step.status === 'completed' ? 'text-emerald-300' :
                        step.status === 'running'   ? 'text-brand-200' :
                        step.status === 'failed'    ? 'text-red-300' :
                        'text-slate-400'
                      )}>
                        {step.title}
                      </p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${toolColor}`}>
                        <ToolIcon size={9} />
                        {step.tool}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1">{step.description}</p>
                    {step.success_criteria && (
                      <p className="text-[10px] text-subtle mt-1">
                        ✓ {step.success_criteria}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ---- Planner Rationale ---- */}
      <div className="card-glass p-5">
        <p className="text-xs text-muted uppercase tracking-wide mb-2">Planner Rationale</p>
        <p className="text-sm text-slate-300 italic">"{plan.rationale}"</p>
      </div>
    </div>
  )
}
