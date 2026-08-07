/**
 * ResearchPlan Page — Visualizes the autonomous research plan and objective parameters.
 *
 * Color Palette: White + Royal Blue (#2563EB)
 */

import { useParams } from 'react-router-dom'

const MOCK_PLAN = {
  plan_id: 'plan-001',
  session_id: 'sess-002',
  question: 'How does CRISPR-Cas9 compare to base editing techniques?',
  objective: 'Systematically compare CRISPR-Cas9 and base editing across accuracy, efficiency, and clinical adoption.',
  iteration: 1,
  rationale: 'Multi-step approach: initial broad search → deep dive per topic → sandbox data analysis → evaluation.',
  created_at: new Date().toISOString(),
  steps: [
    { step_id: 'step-1', order: 1, status: 'completed' },
    { step_id: 'step-2', order: 2, status: 'completed' },
    { step_id: 'step-3', order: 3, status: 'running' },
    { step_id: 'step-4', order: 4, status: 'pending' },
    { step_id: 'step-5', order: 5, status: 'pending' },
  ],
}

export default function ResearchPlanPage() {
  const { sessionId } = useParams()
  const plan = MOCK_PLAN
  const completedSteps = plan.steps.filter((s) => s.status === 'completed').length
  const progress = Math.round((completedSteps / plan.steps.length) * 100)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Research <span className="text-blue-600">Plan</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Session: {sessionId ?? plan.session_id} · Iteration {plan.iteration}
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Research Question</p>
          <p className="text-base font-bold text-slate-900">{plan.question}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Objective</p>
          <p className="text-sm text-slate-700">{plan.objective}</p>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-xs text-slate-500 font-semibold">Progress</p>
            <p className="text-xs font-bold text-blue-600 font-mono">{progress}%</p>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1.5">Planner Rationale</p>
        <p className="text-sm text-slate-700 italic leading-relaxed">"{plan.rationale}"</p>
      </div>
    </div>
  )
}
