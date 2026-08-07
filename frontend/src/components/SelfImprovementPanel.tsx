/**
 * SelfImprovementPanel — Self-Evolving Loop Iteration Component
 *
 * Color Palette: White + Royal Blue (#2563EB)
 * - Iteration flow: Royal Blue #2563EB
 * - Confidence improvement: Blue (61%) → Green (86.5%)
 */

import { RefreshCw, ArrowDown, Sparkles } from 'lucide-react'
import { MOCK_SELF_IMPROVEMENT_ITERATIONS } from '@/services/mockData'
import type { SelfImprovementIteration } from '@/types'
import clsx from 'clsx'

interface SelfImprovementPanelProps {
  iterations?: SelfImprovementIteration[]
}

export default function SelfImprovementPanel({
  iterations = MOCK_SELF_IMPROVEMENT_ITERATIONS,
}: SelfImprovementPanelProps) {
  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <RefreshCw size={18} className="text-blue-600" />
            Self-Evolving Strategy Iterations ({iterations.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Autonomous self-improvement decisions driven by evaluator feedback
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
          <Sparkles size={12} />
          <span>AE-02 Core Feature</span>
        </div>
      </div>

      <div className="space-y-6">
        {iterations.map((iter, idx) => (
          <div key={iter.iteration} className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono">
                    ITERATION {iter.iteration}
                  </span>
                  <span className="text-xs text-slate-700 font-bold">{iter.status}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Confidence:</span>
                  <span
                    className={clsx(
                      'text-sm font-mono font-bold px-3 py-0.5 rounded-full border',
                      iter.confidence >= 80
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    )}
                  >
                    {iter.confidence.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">
                      Problems Detected in Loop
                    </p>
                    <ul className="space-y-1 bg-white p-3 rounded-lg border border-slate-200 text-slate-700">
                      {iter.problems_detected.map((prob, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-1.5">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{prob}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Action Taken
                    </p>
                    <p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed font-medium">
                      {iter.action_taken}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Previous Strategy
                    </p>
                    <p className="text-slate-500 bg-white p-2.5 rounded border border-slate-200 line-through">
                      {iter.previous_strategy}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                      Strategy Change & Adaptation
                    </p>
                    <p className="text-blue-900 bg-blue-50 p-3 rounded-lg border border-blue-200 font-medium leading-relaxed">
                      {iter.strategy_change}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
                      Outcome Result
                    </p>
                    <p className="text-emerald-800 bg-emerald-50 p-2.5 rounded border border-emerald-200 font-bold">
                      {iter.result_summary}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {idx < iterations.length - 1 && (
              <div className="flex justify-center text-blue-600 py-1">
                <ArrowDown size={20} className="animate-bounce" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
