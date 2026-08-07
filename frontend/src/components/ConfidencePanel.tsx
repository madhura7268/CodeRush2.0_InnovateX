/**
 * ConfidencePanel — Evaluator Confidence Scoring Component
 *
 * Color Palette: White + Royal Blue (#2563EB)
 * - Main confidence score: #2563EB
 * - Progress bar indicator: #2563EB
 * - Progress bar track background: #E2E8F0
 */

import { TrendingUp, ShieldCheck } from 'lucide-react'
import { MOCK_EVALUATION_RESULT } from '@/services/mockData'
import type { ConfidenceBreakdown } from '@/types'

interface ConfidencePanelProps {
  overallConfidence?: number
  breakdown?: ConfidenceBreakdown
}

export default function ConfidencePanel({
  overallConfidence = MOCK_EVALUATION_RESULT.overall_confidence,
  breakdown = MOCK_EVALUATION_RESULT.breakdown,
}: ConfidencePanelProps) {
  const dimensions = [
    { label: 'Source Quality', score: breakdown.source_quality },
    { label: 'Evidence Coverage', score: breakdown.evidence_coverage },
    { label: 'Cross-source Consistency', score: breakdown.cross_source_consistency },
    { label: 'Relevance', score: breakdown.relevance },
    { label: 'Validation', score: breakdown.validation },
  ]

  const isHigh = overallConfidence >= 80

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600" />
            Research Confidence Score
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated multi-dimensional evaluation score computed by backend evaluator agent
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 border border-slate-200">
          <ShieldCheck size={13} className={isHigh ? 'text-emerald-600' : 'text-amber-600'} />
          <span className="text-slate-700">Backend Validated</span>
        </div>
      </div>

      {/* Main Metric Hero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-6 rounded-xl bg-slate-50 border border-slate-200">
        {/* Big Score Gauge (Royal Blue) */}
        <div className="text-center md:border-r border-slate-200 md:pr-6">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Overall Confidence
          </p>
          <div className="text-5xl font-black font-mono text-blue-600 py-1">
            {overallConfidence.toFixed(1)}%
          </div>
          <span
            className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
              isHigh
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {isHigh ? 'High Confidence (≥ 80%)' : 'Needs Iteration (< 80%)'}
          </span>
        </div>

        {/* Breakdown Bars (Spans 2 cols) */}
        <div className="md:col-span-2 space-y-3">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Evaluation Breakdown
          </p>

          {dimensions.map((dim) => (
            <div key={dim.label} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-700 font-medium">{dim.label}</span>
                <span className="font-mono font-bold text-blue-600">{dim.score.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${dim.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
