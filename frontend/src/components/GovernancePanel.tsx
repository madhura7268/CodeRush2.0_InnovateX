/**
 * GovernancePanel — Governance Decisions & Security Policy Component
 *
 * Color Palette: White + Royal Blue (#2563EB)
 * Status Colors:
 * - ALLOWED → Green #16A34A text, #F0FDF4 background
 * - BLOCKED → Red #DC2626 text, #FEF2F2 background
 * - APPROVAL REQUIRED → Amber #D97706 text, #FFFBEB background
 */

import { useState } from 'react'
import { ShieldCheck, Lock, CheckCircle2, XCircle, AlertTriangle, Eye } from 'lucide-react'
import { MOCK_AUDIT_LOG, MOCK_GOVERNANCE_PERMISSIONS } from '@/services/mockData'
import type { AuditLogEntry, GovernancePermission, PolicyVerdict } from '@/types'
import clsx from 'clsx'

interface GovernancePanelProps {
  permissions?: GovernancePermission[]
  auditLog?: AuditLogEntry[]
}

function VerdictBadge({ verdict }: { verdict: PolicyVerdict }) {
  switch (verdict) {
    case 'allow':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={10} /> ALLOWED
        </span>
      )
    case 'warn':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle size={10} /> WARN
        </span>
      )
    case 'block':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
          <XCircle size={10} /> BLOCKED
        </span>
      )
  }
}

export default function GovernancePanel({
  permissions = MOCK_GOVERNANCE_PERMISSIONS,
  auditLog = MOCK_AUDIT_LOG,
}: GovernancePanelProps) {
  const [filterVerdict, setFilterVerdict] = useState<string>('ALL')

  const filteredLogs = auditLog.filter((log) => {
    if (filterVerdict === 'ALL') return true
    return log.verdict === filterVerdict.toLowerCase()
  })

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-600" />
            Governance & Safety Enforcement
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active guardrails preventing unauthorized execution or unsafe external actions
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Active Safety Shield
        </span>
      </div>

      {/* Permissions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {permissions.map((perm) => {
          const isAllowed = perm.status === 'ALLOWED'
          const isBlocked = perm.status === 'BLOCKED'
          const isApproval = perm.status === 'HUMAN APPROVAL'

          return (
            <div
              key={perm.action}
              className={clsx(
                'p-3.5 rounded-xl border space-y-1.5 transition-all',
                isAllowed
                  ? 'bg-slate-50 border-slate-200'
                  : isBlocked
                  ? 'bg-red-50/60 border-red-200'
                  : 'bg-amber-50/60 border-amber-200'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{perm.label}</span>
                {isAllowed && <CheckCircle2 size={14} className="text-emerald-600" />}
                {isBlocked && <Lock size={14} className="text-red-600" />}
                {isApproval && <AlertTriangle size={14} className="text-amber-600" />}
              </div>

              <span
                className={clsx(
                  'inline-block text-[10px] font-bold px-2 py-0.5 rounded',
                  isAllowed
                    ? 'bg-emerald-100 text-emerald-800'
                    : isBlocked
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                )}
              >
                {perm.status}
              </span>

              <p className="text-[10px] text-slate-500 leading-tight">{perm.description}</p>
            </div>
          )
        })}
      </div>

      {/* Audit Log Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Eye size={14} className="text-blue-600" />
            Security Audit Trail
          </h3>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-[11px]">
            {['ALL', 'ALLOW', 'WARN', 'BLOCK'].map((verdict) => (
              <button
                key={verdict}
                onClick={() => setFilterVerdict(verdict)}
                className={clsx(
                  'px-2 py-0.5 rounded font-semibold transition-all',
                  filterVerdict === verdict
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {verdict}
              </button>
            ))}
          </div>
        </div>

        {/* Log Entries */}
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <div
              key={log.log_id}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <VerdictBadge verdict={log.verdict} />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-slate-900 text-xs font-bold">{log.action_type}</p>
                  <p className="text-slate-500 text-[11px] truncate">{log.reason}</p>
                </div>
              </div>

              <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
              </span>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-400">
              No governance audit logs matching selected filter.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
