/**
 * LiveActivityPanel — Log stream of real-time backend agent events.
 *
 * Color Palette: White + Royal Blue (#2563EB)
 * Activity Badges:
 * - INFO → #2563EB text, #EFF6FF background
 * - SUCCESS → #16A34A text, #F0FDF4 background
 * - WARNING → #D97706 text, #FFFBEB background
 * - ERROR → #DC2626 text, #FEF2F2 background
 * - RUNNING → #2563EB text, #EFF6FF background
 */

import { useState } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, Loader2, Search, Trash2 } from 'lucide-react'
import { useAgent } from '@/contexts/AgentContext'
import type { EventLevel } from '@/types'
import clsx from 'clsx'

function LevelBadge({ level }: { level: EventLevel }) {
  switch (level) {
    case 'SUCCESS':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={10} /> SUCCESS
        </span>
      )
    case 'RUNNING':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
          <Loader2 size={10} className="animate-spin" /> RUNNING
        </span>
      )
    case 'WARNING':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle size={10} /> WARNING
        </span>
      )
    case 'ERROR':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
          <XCircle size={10} /> ERROR
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
          <Info size={10} /> INFO
        </span>
      )
  }
}

export default function LiveActivityPanel() {
  const { state, dispatch } = useAgent()
  const { liveEvents } = state

  const [filterLevel, setFilterLevel] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState<string>('')

  const filteredEvents = liveEvents.filter((evt) => {
    const matchesLevel = filterLevel === 'ALL' || evt.level === filterLevel
    const matchesSearch =
      !searchTerm ||
      evt.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.node && evt.node.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesLevel && matchesSearch
  })

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="pulse-dot">
            <span></span>
            <span></span>
          </span>
          <h2 className="text-sm font-bold text-slate-900">Live Activity Stream</h2>
        </div>

        <button
          onClick={() => dispatch({ type: 'CLEAR_ACTIVITY_EVENTS' })}
          className="text-slate-400 hover:text-red-600 text-xs flex items-center gap-1 p-1 rounded hover:bg-slate-50 transition-colors"
          title="Clear log stream"
        >
          <Trash2 size={13} />
          <span>Clear</span>
        </button>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Search input */}
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search activity logs..."
            className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>

        {/* Level filter tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-[11px]">
          {['ALL', 'INFO', 'RUNNING', 'SUCCESS', 'WARNING', 'ERROR'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={clsx(
                'px-2 py-0.5 rounded font-semibold transition-all',
                filterLevel === lvl
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Log Feed Container */}
      <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2 pr-1 custom-scrollbar">
        {filteredEvents.map((evt) => (
          <div
            key={evt.id}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors space-y-1 text-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <LevelBadge level={evt.level} />
                {evt.node && (
                  <span className="text-[10px] text-blue-700 font-semibold px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 font-mono">
                    [{evt.node}]
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{evt.timestamp}</span>
            </div>
            <p className="text-slate-700 text-[11px] leading-relaxed font-sans pl-0.5">
              {evt.message}
            </p>
          </div>
        ))}

        {filteredEvents.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400">
            No activity events matching selected filter.
          </div>
        )}
      </div>
    </div>
  )
}
