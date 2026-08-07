/**
 * Sidebar — Left Navigation Sidebar Component
 *
 * Color Palette: White + Royal Blue (#2563EB)
 * - Navigation Hub
 * - Connection Status
 * - Bottom-Left User Profile & Logout Section
 */

import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  History,
  ShieldCheck,
  FileText,
  Settings,
  Cpu,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { useAgent } from '@/contexts/AgentContext'
import { useAuth } from '@/contexts/AuthContext'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', id: 'nav-dashboard' },
  { to: '/history', icon: History, label: 'History', id: 'nav-history' },
  { to: '/governance', icon: ShieldCheck, label: 'Governance', id: 'nav-governance' },
  { to: '/report', icon: FileText, label: 'Reports', id: 'nav-reports' },
  { to: '/settings', icon: Settings, label: 'Settings', id: 'nav-settings' },
]

export default function Sidebar() {
  const { state, dispatch } = useAgent()
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const { sidebarCollapsed, apiHealthy, wsConnected } = state

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <aside
      className={clsx(
        'flex flex-col h-full transition-all duration-300 ease-in-out border-r border-slate-200 bg-white z-30',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200">
        <div
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-blue-600 text-white shadow-sm"
        >
          <Cpu size={18} />
        </div>
        {!sidebarCollapsed && (
          <div className="animate-fade-in">
            <p className="text-sm font-bold text-slate-900 leading-none">AE-02</p>
            <p className="text-xs font-medium text-blue-600 leading-none mt-1">Research Agent</p>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!sidebarCollapsed && (
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Navigation Hub
          </p>
        )}
        {NAV_ITEMS.map(({ to, icon: Icon, label, id }) => (
          <NavLink
            key={to}
            to={to}
            id={id}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
                isActive
                  ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                sidebarCollapsed && 'justify-center px-2'
              )
            }
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Connection Status Footer */}
      {!sidebarCollapsed && (
        <div className="px-4 py-2.5 border-t border-slate-200 space-y-1 text-[11px] bg-slate-50/50">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">FastAPI Backend</span>
            <span className={clsx('font-semibold', apiHealthy ? 'text-emerald-600' : 'text-amber-600')}>
              {apiHealthy ? '● Online' : '○ Checking'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">WebSocket Stream</span>
            <span className={clsx('font-semibold', wsConnected ? 'text-blue-600' : 'text-slate-400')}>
              {wsConnected ? '● Live' : '○ Idle'}
            </span>
          </div>
        </div>
      )}

      {/* Bottom-Left User Profile Section */}
      {currentUser && (
        <div className="p-3 border-t border-slate-200 bg-slate-50/80">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold font-mono flex-shrink-0 shadow-sm">
                  {currentUser.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {currentUser.displayName}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors flex-shrink-0"
                title="Logout of AE-02"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold font-mono shadow-sm"
                title={`${currentUser.displayName} (${currentUser.email})`}
              >
                {currentUser.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        id="sidebar-toggle"
        onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        className="flex items-center justify-center py-2.5 border-t border-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
        aria-label="Toggle sidebar"
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  )
}
