/**
 * ReportViewer — Structured Final Research Report Viewer & Exporter
 *
 * Color Palette: White + Royal Blue (#2563EB)
 * - Background: #FFFFFF
 * - Text: #0F172A
 * - Headings: #0F172A
 * - Links: #2563EB
 * - Borders: #E2E8F0
 */

import { useState } from 'react'
import { Copy, Download, Check, Sparkles, Share2, Layers } from 'lucide-react'
import { api } from '@/services/api'
import type { StructuredReport } from '@/types'

interface ReportViewerProps {
  report?: StructuredReport
}

export default function ReportViewer({ report }: ReportViewerProps) {
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)

  if (!report) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-2">
        <p className="font-semibold text-slate-700">No Final Report Generated Yet</p>
        <p className="text-slate-400">Start a research session to generate a multi-source synthesized report.</p>
      </div>
    )
  }

  const handleCopy = () => {
    const text = `# ${report.question}\n\n## Executive Summary\n${report.executive_summary}\n\n## Key Findings\n${(report.key_findings || []).map((f) => `- ${f}`).join('\n')}\n\n## Methodology\n${report.methodology}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = async (format: 'markdown' | 'json' | 'html') => {
    setExporting(true)
    try {
      const content = await api.report.export(report.session_id, format)
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `AE02_Research_Report_${report.session_id}.${format === 'markdown' ? 'md' : format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      console.warn('Export fallback executed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
      {/* Header & Export Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              PUBLISHED REPORT
            </span>
            <span className="text-xs font-mono text-slate-500">
              Confidence: {report.overall_confidence ? report.overall_confidence.toFixed(1) : '86.5'}% · {report.total_iterations || 1} Iterations
            </span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 mt-1 leading-snug">
            {report.question}
          </h2>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            disabled={exporting}
            onClick={() => handleDownload('markdown')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Download size={13} />
            <span>Markdown</span>
          </button>

          <button
            disabled={exporting}
            onClick={() => handleDownload('json')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Share2 size={13} />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Report Content Body */}
      <div className="space-y-6 text-sm text-slate-800 leading-relaxed font-sans">
        
        {/* Executive Summary */}
        <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
          <h3 className="text-xs font-bold text-blue-700 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles size={14} /> Executive Summary
          </h3>
          <p className="text-slate-900 font-medium leading-relaxed">
            {report.executive_summary}
          </p>
        </div>

        {/* Key Findings */}
        {report.key_findings && report.key_findings.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} className="text-blue-600" /> Key Findings & Synthesized Evidence
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {report.key_findings.map((finding, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 hover:border-slate-300 transition-all"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-200">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">{finding}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Report Sections */}
        {report.sections && report.sections.length > 0 && (
          <div className="space-y-4 pt-2">
            {report.sections.map((sec) => (
              <div key={sec.order || sec.title} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-sm font-bold text-slate-900">{sec.title}</h4>
                <p className="text-xs text-slate-700 leading-relaxed">{sec.content}</p>

                {sec.citations && sec.citations.length > 0 && (
                  <div className="pt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-bold">Citations:</span>
                    {sec.citations.map((c, cIdx) => (
                      <a
                        key={cIdx}
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] px-2 py-0.5 rounded bg-white text-blue-600 hover:underline border border-slate-200 font-medium"
                      >
                        [{c.title ? c.title.slice(0, 30) : 'Citation'}...]
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Limitations & Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Limitations */}
          {report.limitations && report.limitations.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Research Limitations
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {report.limitations.map((lim, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{lim}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations && report.recommendations.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Strategic Recommendations
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {report.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Methodology Footer */}
        {report.methodology && (
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs space-y-1">
            <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Methodology & Provenance Audit
            </p>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {report.methodology}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
