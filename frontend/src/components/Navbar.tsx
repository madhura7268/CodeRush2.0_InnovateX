/**
 * Navbar — Top Navigation Header & System Status Indicators
 *
 * Color Palette: White + Royal Blue (#2563EB)
 * - Left: Active Session Status & Loop Iteration Counter
 * - Right: System API & WebSocket Connectivity Badges
 */

import { Shield, Zap, AlertTriangle, RefreshCw } from 'lucide-react'
import { useAgent } from '@/contexts/AgentContext'
import { api } from '@/services/api'
import { useEffect } from 'react'

export default function Navbar() {
  const { state, dispatch } = useAgent()

  const {
    systemStatus,
    activeSession,
    apiHealthy,
    wsConnected,
    pendingApproval,
  } = state

  useEffect(() => {
    const checkHealth = () => {
      api.health
        .check()
        .then(() => dispatch({ type: 'SET_API_HEALTH', payload: true }))
        .catch(() => dispatch({ type: 'SET_API_HEALTH', payload: false }))
    }
    checkHealth()
    const interval = setInterval(checkHealth, 20_000)
    return () => clearInterval(interval)
  }, [dispatch])

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Researching':
        return 'bg-blue-50 text-blue-600 border-blue-200'
      case 'Completed':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200'
      case 'Paused':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'Error':
        return 'bg-red-50 text-red-600 border-red-200'
      default:
        return 'bg-emerald-50 text-emerald-600 border-emerald-200'
    }
  }

  return (
    <header
      className="flex flex-wrap items-center justify-between px-6 py-3 border-b border-slate-200 bg-white z-20 gap-3"
    >
      {/* Left Cluster: Active Session Status & Iteration */}
      <div className="flex items-center gap-2.5">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-[10px] mr-1">
          Agent State:
        </span>

        {/* System Status Pill */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(systemStatus)}`}>
          {systemStatus === 'Researching' && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
          )}
          {systemStatus === 'Completed' && <span className="text-emerald-600">✓</span>}
          {systemStatus === 'Paused' && <span className="text-amber-600">⏸</span>}
          {systemStatus === 'Error' && <span className="text-red-600">✕</span>}
          {systemStatus === 'Online' && <span className="text-emerald-600">●</span>}
          <span>{systemStatus}</span>
        </div>

        {/* Iteration Counter Badge */}
        {activeSession && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-blue-50 text-blue-600 border border-blue-200">
            <RefreshCw size={11} className={systemStatus === 'Researching' ? 'animate-spin' : ''} />
            <span>
              Iteration {activeSession.current_iteration} / {activeSession.max_iterations}
            </span>
          </div>
        )}

        {/* Human Approval Alert Trigger (HITL) */}
        {pendingApproval && (
          <button
            id="hitl-approval-badge-btn"
            onClick={() => dispatch({ type: 'SET_PENDING_APPROVAL', payload: pendingApproval })}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <AlertTriangle size={12} className="text-amber-600" />
            <span>Approval Required</span>
          </button>
        )}
      </div>

      {/* Right Cluster: API & WebSocket Connectivity Status */}
      <div className="flex items-center gap-2.5">
        {/* API Status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            apiHealthy
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
          title={apiHealthy ? 'FastAPI Backend Online' : 'API Unreachable'}
        >
          <Zap size={10} />
          <span>API {apiHealthy ? 'Online' : 'Offline'}</span>
        </div>

        {/* WS Status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            wsConnected
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
          title={wsConnected ? 'Real-time WebSocket Live' : 'WebSocket Disconnected'}
        >
          <Shield size={10} />
          <span>WS {wsConnected ? 'Live' : 'Idle'}</span>
        </div>
      </div>
    </header>
  )
}
