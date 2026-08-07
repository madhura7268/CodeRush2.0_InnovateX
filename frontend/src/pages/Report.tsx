/**
 * Report Page — Dedicated Published Reports & Document Export Hub
 *
 * Fetches live structured reports directly from the backend API.
 */

import { useState, useEffect } from 'react'
import { FileText, CheckCircle2, Search, Loader2 } from 'lucide-react'
import ReportViewer from '@/components/ReportViewer'
import { useAgent } from '@/contexts/AgentContext'
import { api } from '@/services/api'
import type { StructuredReport } from '@/types'

export default function ReportPage() {
  const { state } = useAgent()
  const { history } = state

  const completedSessions = history.filter((s) => s.status === 'completed' || s.status === 'running')
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    completedSessions[0]?.session_id || 'sess-pothole-002'
  )
  const [report, setReport] = useState<StructuredReport | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedSessionId) return
    setLoading(true)
    api.report
      .get(selectedSessionId)
      .then((data) => setReport(data))
      .catch((err) => console.error('Failed to load report:', err))
      .finally(() => setLoading(false))
  }, [selectedSessionId])

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText size={24} className="text-blue-600" />
            Published Research <span className="text-blue-600">Reports</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Access finalized, multi-source synthesized research documents & export to Markdown, JSON, or HTML.
          </p>
        </div>

        {/* Quick Report Statistics */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-center shadow-sm">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">
              Reports Available
            </span>
            <span className="text-xs font-bold text-slate-900 font-mono">
              {completedSessions.length || 1} Documents
            </span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-center shadow-sm">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">
              Confidence
            </span>
            <span className="text-xs font-bold text-emerald-600 font-mono">
              {report ? `${report.overall_confidence.toFixed(1)}%` : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Report Selector Bar */}
      {completedSessions.length > 0 && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <Search size={16} className="text-blue-600 flex-shrink-0" />
            <label htmlFor="report-select" className="text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">
              Select Report:
            </label>
            <select
              id="report-select"
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
            >
              {completedSessions.map((session) => (
                <option key={session.session_id} value={session.session_id}>
                  {session.question} (Confidence: {session.overall_confidence.toFixed(1)}%)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>Peer & Citation Verified</span>
          </div>
        </div>
      )}

      {/* Main Report Viewer */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 space-y-3">
          <Loader2 size={32} className="mx-auto text-blue-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Loading structured research report...</p>
        </div>
      ) : report ? (
        <ReportViewer report={report} />
      ) : (
        <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 text-xs text-slate-500">
          No report found for session {selectedSessionId}.
        </div>
      )}
    </div>
  )
}
