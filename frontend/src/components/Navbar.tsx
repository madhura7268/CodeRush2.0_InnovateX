/**
 * Navbar — Top navigation bar component.
 */

import { Bell, Zap } from 'lucide-react'
import { useAgent } from '@/contexts/AgentContext'
import { useEffect } from 'react'
import { api } from '@/services/api'

export default function Navbar() {
  const { state, dispatch } = useAgent()
  const { apiHealthy, activeSessionId } = state

  // Check API health on mount
  useEffect(() => {
    api.health.check()
      .then(() => dispatch({ type: 'SET_API_HEALTH', payload: true }))
      .catch(() => dispatch({ type: 'SET_API_HEALTH', payload: false }))
  }, [dispatch])

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5"
            style={{ background: 'rgba(8, 13, 24, 0.8)', backdropFilter: 'blur(12px)' }}>
      {/* ---- Page Context ---- */}
      <div className="flex items-center gap-3">
        {activeSessionId && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
               style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
            <span className="pulse-dot">
              <span></span>
              <span></span>
            </span>
            <span className="text-xs font-medium text-brand-300">
              Session: {activeSessionId.slice(0, 8)}…
            </span>
          </div>
        )}
      </div>

      {/* ---- Right Controls ---- */}
      <div className="flex items-center gap-3">
        {/* API Status pill */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
          apiHealthy
            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
            : 'bg-red-950/60 text-red-400 border-red-800/50'
        }`}>
          <Zap size={10} />
          {apiHealthy ? 'API Healthy' : 'API Offline'}
        </div>

        {/* Notifications placeholder */}
        <button id="notifications-btn"
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors duration-200"
                aria-label="Notifications">
          <Bell size={18} />
        </button>
      </div>
    </header>
  )
}
