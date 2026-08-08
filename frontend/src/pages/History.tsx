/**
 * History Page — Past Research Sessions Archive
 *
 * Color Palette: White + Royal Blue (#2563EB)
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { History as HistoryIcon, Search, ExternalLink } from 'lucide-react'
import { useAgent } from '@/contexts/AgentContext'
import StatusBadge from '@/components/StatusBadge'
import { formatHistoryDate } from '@/utils/formatters'
import clsx from 'clsx'

export default function HistoryPage() {
  const { state, dispatch } = useAgent()
  const { history } = state
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('ALL')

  const handleSelectSession = (sessionId: string) => {
    dispatch({ type: 'SET_ACTIVE_SESSION', payload: sessionId })
    navigate(`/report?session_id=${sessionId}`)
  }

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())))

    const matchesStatus =
      selectedStatus === 'ALL' || item.status.toLowerCase() === selectedStatus.toLowerCase()

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <HistoryIcon size={22} className="text-blue-600" />
          Research Session <span className="text-blue-600">History Archive</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review past autonomous research sessions, iteration logs, retrieved evidence, & generated reports.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search history by topic or tag..."
            className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          {['ALL', 'completed', 'running', 'failed'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={clsx(
                'px-3 py-1 rounded-lg font-semibold capitalize transition-all',
                selectedStatus === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredHistory.map((item) => (
          <div
            key={item.session_id}
            onClick={() => handleSelectSession(item.session_id)}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer space-y-3 group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-mono font-bold text-blue-600">
                    {item.session_id}
                  </span>
                  <StatusBadge status={item.status} />
                  <span className="text-[11px] text-slate-500">{formatHistoryDate(item.date)}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {item.question}
                </h3>
              </div>

              <button
                className="p-2 rounded-xl bg-slate-100 group-hover:bg-blue-50 text-slate-500 group-hover:text-blue-600 border border-slate-200 transition-all"
                title="Inspect session details"
              >
                <ExternalLink size={16} />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span>
                  Iterations: <strong className="text-slate-900 font-mono">{item.iterations === 1 ? '1 iteration' : `${item.iterations} iterations`}</strong>
                </span>
                <span>
                  Sources: <strong className="text-blue-600 font-mono">{item.sources_count}</strong>
                </span>
                <span>
                  Confidence:{' '}
                  <strong className="text-emerald-600 font-mono">
                    {item.overall_confidence.toFixed(1)}%
                  </strong>
                </span>
              </div>

              {item.tags && (
                <div className="flex items-center gap-1.5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredHistory.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            No research session history entries match your search criteria.
          </div>
        )}
      </div>
    </div>
  )
}
