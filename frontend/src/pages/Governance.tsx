/**
 * Governance Page — Displays policy configurations and audit log.
 */

import { Shield, CheckCircle2, XCircle, AlertTriangle, Eye } from 'lucide-react'
import type { PolicyVerdict } from '@/types'
import clsx from 'clsx'

// ---------------------------------------------------------------------------
// Mock data — replace with real API data (useGovernance hook)
// ---------------------------------------------------------------------------
const MOCK_POLICIES = [
  { name: 'Content Policy', status: 'placeholder', enabled: false, checks: 0 },
  { name: 'Resource Policy', status: 'placeholder', enabled: false, checks: 0 },
  { name: 'Sandbox Policy', status: 'placeholder', enabled: false, checks: 0 },
  { name: 'Network Policy', status: 'placeholder', enabled: false, checks: 0 },
  { name: 'Data Exfiltration Policy', status: 'planned', enabled: false, checks: 0 },
]

const MOCK_AUDIT_LOG = [
  { log_id: '1', action_type: 'web_search', verdict: 'allow' as PolicyVerdict, reason: 'Action permitted', timestamp: new Date(Date.now() - 60000).toISOString() },
  { log_id: '2', action_type: 'execute_code', verdict: 'allow' as PolicyVerdict, reason: 'Sandbox policy not enforced (placeholder)', timestamp: new Date(Date.now() - 120000).toISOString() },
  { log_id: '3', action_type: 'store_data', verdict: 'allow' as PolicyVerdict, reason: 'Data policy not enforced (placeholder)', timestamp: new Date(Date.now() - 240000).toISOString() },
]

function VerdictBadge({ verdict }: { verdict: PolicyVerdict }) {
  return (
    <span className={clsx('badge', {
      'badge-completed': verdict === 'allow',
      'badge-failed': verdict === 'block',
      'badge-paused': verdict === 'warn',
    })}>
      {verdict === 'allow' && <CheckCircle2 size={10} />}
      {verdict === 'block' && <XCircle size={10} />}
      {verdict === 'warn' && <AlertTriangle size={10} />}
      {verdict}
    </span>
  )
}

export default function GovernancePage() {
  return (
    <div className="space-y-6 animate-fade-in">

      {/* ---- Header ---- */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          <span className="text-gradient">Governance</span> & Safety
        </h1>
        <p className="text-sm text-muted mt-1">
          Policy registry and audit trail for all agent actions.
        </p>
      </div>

      {/* ---- Policy Status Cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_POLICIES.map((policy) => (
          <div
            key={policy.name}
            id={`policy-${policy.name.toLowerCase().replace(/\s/g, '-')}`}
            className="card-glass p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{policy.name}</p>
                <p className="text-xs text-muted mt-0.5 capitalize">{policy.status}</p>
              </div>
              <Shield size={16} className={policy.enabled ? 'text-emerald-400' : 'text-slate-600'} />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className={clsx(
                'text-xs font-medium px-2 py-0.5 rounded-full border',
                policy.enabled
                  ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/40'
                  : 'bg-slate-800/50 text-slate-500 border-slate-700/40'
              )}>
                {policy.enabled ? 'Enabled' : 'Not Implemented'}
              </span>
              <span className="text-xs text-muted">{policy.checks} checks</span>
            </div>
          </div>
        ))}
      </div>

      {/* ---- Audit Log ---- */}
      <div className="card-glass p-5">
        <div className="flex items-center gap-2 mb-4">
          <Eye size={16} className="text-brand-400" />
          <h2 className="text-sm font-semibold text-white">Audit Log</h2>
          <span className="ml-auto text-xs text-muted">Last 50 entries</span>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 pb-2 mb-2 border-b border-white/5 text-[10px] font-semibold uppercase tracking-wide text-muted">
          <div className="col-span-3">Action</div>
          <div className="col-span-2">Verdict</div>
          <div className="col-span-5">Reason</div>
          <div className="col-span-2">Time</div>
        </div>

        {/* Rows */}
        <div className="space-y-1.5">
          {MOCK_AUDIT_LOG.map((entry) => (
            <div
              key={entry.log_id}
              id={`audit-${entry.log_id}`}
              className="grid grid-cols-12 gap-2 py-2.5 px-2 rounded-lg hover:bg-white/3 transition-colors"
            >
              <div className="col-span-3">
                <span className="text-xs font-mono text-slate-300">{entry.action_type}</span>
              </div>
              <div className="col-span-2">
                <VerdictBadge verdict={entry.verdict} />
              </div>
              <div className="col-span-5">
                <span className="text-xs text-muted truncate block">{entry.reason}</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-subtle">
                  {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-yellow-950/20 border border-yellow-800/30 flex items-center gap-2">
          <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0" />
          <p className="text-xs text-yellow-300/80">
            Governance Engine is running in <strong>placeholder mode</strong>. All actions are permitted.
            Implement real policy checks before production deployment.
          </p>
        </div>
      </div>
    </div>
  )
}
