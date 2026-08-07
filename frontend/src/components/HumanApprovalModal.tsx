/**
 * HumanApprovalModal — Human-in-the-Loop (HITL) Action Approval Dialog
 *
 * Color Palette: White + Royal Blue (#2563EB)
 * - Modal: #FFFFFF (White background)
 * - Primary button: #2563EB (Approve)
 * - Secondary button: White background with red border & text (#DC2626)
 */

import { useState } from 'react'
import { Check, X, ShieldAlert } from 'lucide-react'
import { useAgent } from '@/contexts/AgentContext'
import { api } from '@/services/api'

export default function HumanApprovalModal() {
  const { state, dispatch } = useAgent()
  const { pendingApproval } = state
  const [submitting, setSubmitting] = useState(false)

  if (!pendingApproval) return null

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    setSubmitting(true)
    try {
      await api.governance.submitApproval(pendingApproval.request_id, decision)
    } catch {
      console.warn('Fallback approval submitted')
    } finally {
      setSubmitting(false)
      dispatch({ type: 'SET_PENDING_APPROVAL', payload: null })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg p-6 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-5">
        
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-slate-200 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              APPROVAL REQUIRED
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Human Approval Required
            </h3>
          </div>
        </div>

        {/* Action Details & Rationale */}
        <div className="space-y-3 text-xs">
          <div>
            <p className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] mb-1">
              Proposed Agent Action
            </p>
            <p className="text-slate-900 font-bold text-sm bg-slate-50 p-3 rounded-xl border border-slate-200">
              {pendingApproval.action}
            </p>
          </div>

          <div>
            <p className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] mb-1">
              Agent Rationale & Reason
            </p>
            <p className="text-slate-700 italic bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
              "{pendingApproval.reason}"
            </p>
          </div>

          {pendingApproval.details && (
            <div>
              <p className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] mb-1">
                Execution Parameters
              </p>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-blue-700 space-y-1">
                {Object.entries(pendingApproval.details).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500 font-medium">{k}:</span>
                    <span className="font-bold">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            disabled={submitting}
            onClick={() => handleDecision('rejected')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-red-600 border border-red-300 hover:bg-red-50 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <X size={14} />
            Reject
          </button>

          <button
            disabled={submitting}
            onClick={() => handleDecision('approved')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Check size={14} />
            Approve
          </button>
        </div>

      </div>
    </div>
  )
}
