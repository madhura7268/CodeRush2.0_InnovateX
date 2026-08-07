/**
 * EvaluationPanel — Backend Evaluator Agent Results Component
 *
 * Color Palette: White + Royal Blue (#2563EB)
 * - Overall score: Royal Blue #2563EB
 * - Strengths: Green #16A34A text, #F0FDF4 background
 * - Weaknesses: Amber #D97706 text, #FFFBEB background
 * - Recommendation: Clean white box
 */

import { CheckCircle2, AlertCircle, FileText, RefreshCw, Award } from 'lucide-react'
import { MOCK_EVALUATION_RESULT } from '@/services/mockData'
import type { EvaluationResult } from '@/types'
import clsx from 'clsx'

interface EvaluationPanelProps {
  evaluation?: EvaluationResult
}

export default function EvaluationPanel({ evaluation = MOCK_EVALUATION_RESULT }: EvaluationPanelProps) {
  const isReport = evaluation.decision === 'REPORT'

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
      {/* Header & Decision Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award size={18} className="text-blue-600" />
            Evaluator Analysis & Decision
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Iteration {evaluation.iteration} evaluation output & action recommendation
          </p>
        </div>

        {/* Decision Badge */}
        <div
          className={clsx(
            'flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black tracking-wider border transition-all',
            isReport
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-amber-50 text-amber-700 border-amber-300'
          )}
        >
          {isReport ? <FileText size={14} /> : <RefreshCw size={14} className="animate-spin" />}
          <span>DECISION: {evaluation.decision}</span>
        </div>
      </div>

      {/* Strengths & Weaknesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths (Green) */}
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
          <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600" /> Identified Strengths
          </h3>
          <ul className="space-y-2 text-xs text-slate-800">
            {evaluation.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses (Amber) */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
          <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle size={14} className="text-amber-600" /> Gaps & Weaknesses
          </h3>
          <ul className="space-y-2 text-xs text-slate-800">
            {evaluation.weaknesses.map((weak, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>{weak}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Evaluator Recommendation Box */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Evaluator Recommendation</p>
        <p className="text-xs text-slate-800 leading-relaxed italic">
          "{evaluation.recommendation}"
        </p>
      </div>
    </div>
  )
}
