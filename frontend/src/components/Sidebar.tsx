/**
 * Sidebar — Navigation sidebar component.
 *
 * Displays the app brand, navigation links, and connection status indicators.
 */

import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  Shield,
  FileText,
  Settings,
  Cpu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAgent } from '@/contexts/AgentContext'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', id: 'nav-dashboard' },
  { to: '/research', icon: Search, label: 'Research', id: 'nav-research' },
  { to: '/governance', icon: Shield, label: 'Governance', id: 'nav-governance' },
  { to: '/report', icon: FileText, label: 'Reports', id: 'nav-reports' },
  { to: '/settings', icon: Settings, label: 'Settings', id: 'nav-settings' },
]

export default function Sidebar() {
  const { state, dispatch } = useAgent()
  const { sidebarCollapsed, apiHealthy, wsConnected } = state

  return (
    <aside
      className={clsx(
        'flex flex-col h-full transition-all duration-300 ease-in-out',
        'border-r border-white/5',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
      style={{ background: 'rgba(8, 13, 24, 0.95)' }}
    >
      {/* ---- Brand ---- */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
             style={{ background: 'linear-gradient(135deg, #4f46e5, #06b6d4)' }}>
          <Cpu size={16} className="text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="animate-fade-in">
            <p className="text-sm font-bold text-white leading-none">Research</p>
            <p className="text-xs font-medium text-accent-400 leading-none mt-0.5">Agent v0.1</p>
          </div>
        )}
      </div>

      {/* ---- Navigation ---- */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {!sidebarCollapsed && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
            Navigation
          </p>
        )}
        {NAV_ITEMS.map(({ to, icon: Icon, label, id }) => (
          <NavLink
            key={to}
            to={to}
            id={id}
            className={({ isActive }) =>
              clsx('nav-item', isActive && 'active', sidebarCollapsed && 'justify-center px-2')
            }
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* ---- Status Indicators ---- */}
      {!sidebarCollapsed && (
        <div className="px-4 py-3 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">API</span>
            <span className={clsx(
              'text-xs font-medium',
              apiHealthy ? 'text-emerald-400' : 'text-red-400'
            )}>
              {apiHealthy ? '● Online' : '● Offline'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">WebSocket</span>
            <span className={clsx(
              'text-xs font-medium',
              wsConnected ? 'text-emerald-400' : 'text-slate-500'
            )}>
              {wsConnected ? '● Connected' : '○ Idle'}
            </span>
          </div>
        </div>
      )}

      {/* ---- Collapse Toggle ---- */}
      <button
        id="sidebar-toggle"
        onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        className={clsx(
          'flex items-center justify-center py-3 border-t border-white/5',
          'text-slate-500 hover:text-slate-300 transition-colors duration-200'
        )}
        aria-label="Toggle sidebar"
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  )
}
