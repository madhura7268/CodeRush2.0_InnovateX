/**
 * Dashboard Page — Main landing page for the Research Agent.
 *
 * Displays:
 * - KPI metric cards (total sessions, active, avg confidence, governance checks)
 * - Research submission form
 * - Recent sessions list
 * - Live event feed
 */

import { useState } from 'react'
import {
  Brain,
  Search,
  Shield,
  TrendingUp,
  Send,
  Zap,
  BookOpen,
  AlertTriangle,
} from 'lucide-react'
import MetricCard from '@/components/MetricCard'
import StatusBadge from '@/components/StatusBadge'
import { useResearch } from '@/hooks/useResearch'
import { useAgent } from '@/contexts/AgentContext'
import { formatRelativeTime, truncate } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Mock data — replace with real API data when modules are implemented
// ---------------------------------------------------------------------------
const MOCK_SESSIONS = [
  {
    session_id: 'sess-001',
    question: 'What are the latest breakthroughs in quantum error correction?',
    status: 'completed' as const,
    overall_confidence: 0.87,
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    session_id: 'sess-002',
    question: 'How does CRISPR-Cas9 compare to base editing techniques?',
    status: 'running' as const,
    overall_confidence: 0.52,
    updated_at: new Date(Date.now() - 300000).toISOString(),
  },
  {
    session_id: 'sess-003',
    question: 'What are the economic impacts of large language models on knowledge work?',
    status: 'failed' as const,
    overall_confidence: 0.0,
    updated_at: new Date(Date.now() - 7200000).toISOString(),
  },
]

const MOCK_EVENTS = [
  { type: 'step_completed', message: 'Web search completed: 12 sources found', time: '2m ago' },
  { type: 'step_started', message: 'Starting sandbox experiment: data analysis', time: '3m ago' },
  { type: 'iteration_evaluated', message: 'Iteration 2 confidence: 87.2%', time: '5m ago' },
  { type: 'session_started', message: 'New research session started', time: '12m ago' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const [question, setQuestion] = useState('')
  const { isLoading, error, startResearch } = useResearch()
  const { state } = useAgent()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || question.length < 10) return
    const sessionId = await startResearch({ question })
    if (sessionId) setQuestion('')
  }

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ---- Page Header ---- */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Research <span className="text-gradient">Command Center</span>
        </h1>
        <p className="text-sm text-muted mt-1">
          Autonomous AI research — plan, search, experiment, and evaluate.
        </p>
      </div>

      {/* ---- KPI Metrics ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          id="metric-total-sessions"
          title="Total Sessions"
          value="24"
          subtitle="All time"
          icon={Brain}
          iconColor="text-brand-400"
          trend="up"
          trendValue="12% this week"
          glow="brand"
        />
        <MetricCard
          id="metric-active-sessions"
          title="Active Sessions"
          value={state.activeSessionId ? 1 : 0}
          subtitle="Currently running"
          icon={Zap}
          iconColor="text-accent-400"
          glow="accent"
        />
        <MetricCard
          id="metric-avg-confidence"
          title="Avg Confidence"
          value="79%"
          subtitle="Last 10 sessions"
          icon={TrendingUp}
          iconColor="text-emerald-400"
          trend="up"
          trendValue="4% improvement"
          glow="success"
        />
        <MetricCard
          id="metric-governance-checks"
          title="Policy Checks"
          value="142"
          subtitle="0 violations today"
          icon={Shield}
          iconColor="text-yellow-400"
        />
      </div>

      {/* ---- Research Input ---- */}
      <div className="card-glass p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search size={18} className="text-brand-400" />
          <h2 className="text-base font-semibold text-white">New Research Query</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            id="research-question-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your research question... (e.g. 'What are the safety implications of autonomous AI agents in healthcare?')"
            rows={3}
            className="input-field resize-none"
          />
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-lg px-3 py-2">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">
              {question.length}/2000 chars · Min 10 characters
            </p>
            <button
              id="start-research-btn"
              type="submit"
              disabled={isLoading || question.length < 10}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Send size={14} />
              {isLoading ? 'Starting...' : 'Start Research'}
            </button>
          </div>
        </form>
      </div>

      {/* ---- Bottom Grid: Sessions + Live Events ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Recent Sessions (3/5 width) */}
        <div className="lg:col-span-3 card-glass p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-brand-400" />
            <h2 className="text-sm font-semibold text-white">Recent Sessions</h2>
          </div>
          <div className="space-y-3">
            {MOCK_SESSIONS.map((session) => (
              <div
                key={session.session_id}
                id={`session-row-${session.session_id}`}
                className="flex items-start justify-between p-3 rounded-xl border border-white/5 hover:bg-white/3 transition-colors duration-150 cursor-pointer"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {truncate(session.question, 60)}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {formatRelativeTime(session.updated_at)} ·{' '}
                    {Math.round(session.overall_confidence * 100)}% confidence
                  </p>
                </div>
                <StatusBadge status={session.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Live Events (2/5 width) */}
        <div className="lg:col-span-2 card-glass p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="pulse-dot">
              <span></span>
              <span></span>
            </span>
            <h2 className="text-sm font-semibold text-white">Live Events</h2>
          </div>
          <div className="space-y-3">
            {MOCK_EVENTS.map((event, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-300 leading-relaxed">{event.message}</p>
                  <p className="text-[10px] text-subtle mt-0.5">{event.time}</p>
                </div>
              </div>
            ))}
            {state.liveEvents.length === 0 && (
              <p className="text-xs text-subtle text-center py-4">
                Start a research session to see live events.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
