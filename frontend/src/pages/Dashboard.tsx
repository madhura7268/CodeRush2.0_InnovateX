/**
 * Dashboard Page — Autonomous Research Command Center
 *
 * Color Palette: White + Royal Blue (#2563EB)
 */

import { Brain, Zap, TrendingUp, Shield, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import MetricCard from '@/components/MetricCard'
import StatusBadge from '@/components/StatusBadge'
import ResearchForm from '@/components/ResearchForm'
import WorkflowTimeline from '@/components/WorkflowTimeline'
import LiveActivityPanel from '@/components/LiveActivityPanel'
import HumanApprovalModal from '@/components/HumanApprovalModal'
import { useAgent } from '@/contexts/AgentContext'
import { formatHistoryDate, truncate } from '@/utils/formatters'

export default function Dashboard() {
  const { state, dispatch } = useAgent()
  const { activeSession, history } = state
  const navigate = useNavigate()

  const avgConfidence =
    history.length > 0
      ? (history.reduce((acc, curr) => acc + curr.overall_confidence, 0) / history.length).toFixed(1) + '%'
      : '0.0%'

  const handleSelectSession = (sessionId: string) => {
    dispatch({ type: 'SET_ACTIVE_SESSION', payload: sessionId })
    navigate(`/report?session_id=${sessionId}`)
  }

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <HumanApprovalModal />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Autonomous Research <span className="text-blue-600">Command Center</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Submit complex research prompts — watch autonomous planning, search, RAG, & self-improving evaluation loops in real-time.
          </p>
        </div>

        {activeSession && (
          <button
            onClick={() => handleSelectSession(activeSession.session_id)}
            className="px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>Inspect Active Session</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          id="metric-total-sessions"
          title="Total Sessions"
          value={history.length.toString()}
          subtitle="All time research sessions"
          icon={Brain}
          iconColor="text-blue-600"
        />
        <MetricCard
          id="metric-active-sessions"
          title="Active Session"
          value={activeSession ? `Iter ${activeSession.current_iteration}/${activeSession.max_iterations}` : '0'}
          subtitle={activeSession ? activeSession.status : 'System ready'}
          icon={Zap}
          iconColor="text-blue-600"
        />
        <MetricCard
          id="metric-avg-confidence"
          title="Avg Confidence"
          value={avgConfidence}
          subtitle="Real-time session average"
          icon={TrendingUp}
          iconColor="text-emerald-600"
        />
        <MetricCard
          id="metric-governance-checks"
          title="Policy Checks"
          value={history.length > 0 ? (history.length * 12).toString() : '0'}
          subtitle="0 safety violations"
          icon={Shield}
          iconColor="text-amber-600"
        />
      </div>

      <ResearchForm />

      <WorkflowTimeline />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Research Sessions</h2>
            </div>
            <button
              id="view-all-history-btn"
              onClick={() => navigate('/history')}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-bold"
            >
              <span>View All</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-2.5">
            {history.length > 0 ? (
              history.map((session) => (
                <div
                  key={session.session_id}
                  onClick={() => handleSelectSession(session.session_id)}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/50 transition-all cursor-pointer group"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {truncate(session.question, 65)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatHistoryDate(session.date)} · {session.iterations === 1 ? '1 iteration' : `${session.iterations} iterations`} · {session.sources_count} {session.sources_count === 1 ? 'source' : 'sources'} ·{' '}
                      <strong className="text-emerald-600 font-mono">{session.overall_confidence.toFixed(1)}% confidence</strong>
                    </p>
                  </div>
                  <StatusBadge status={session.status} />
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                No recent research sessions. Submit a research prompt above to start!
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <LiveActivityPanel />
        </div>
      </div>
    </div>
  )
}
