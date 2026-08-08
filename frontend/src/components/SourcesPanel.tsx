/**
 * SourcesPanel — Retrieved Sources Inspection Component
 *
 * Color Palette: White + Royal Blue (#2563EB)
 * - Card: #FFFFFF
 * - Border: #E2E8F0
 * - Title: #0F172A
 * - Secondary text: #64748B
 * - Relevance score: #2563EB
 * - Verified: #16A34A text, #F0FDF4 background
 * - Source Type badges: #EFF6FF background with #2563EB text
 */

import { useState, useEffect } from 'react'
import { Globe, ExternalLink, CheckCircle2, AlertTriangle, Filter } from 'lucide-react'
import { useAgent } from '@/contexts/AgentContext'
import { api } from '@/services/api'
import type { SourceItem, SourceType, VerificationStatus } from '@/types'
import clsx from 'clsx'

interface SourcesPanelProps {
  sources?: SourceItem[]
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  switch (status) {
    case 'Verified':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={10} /> Verified
        </span>
      )
    case 'Unverified':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle size={10} /> Unverified
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
          Flagged
        </span>
      )
  }
}

function SourceTypeBadge({ type }: { type: SourceType }) {
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
      {type}
    </span>
  )
}

export default function SourcesPanel({ sources: propsSources }: SourcesPanelProps) {
  const { state } = useAgent()
  const { activeSessionId } = state
  const [liveSources, setLiveSources] = useState<SourceItem[]>([])
  const [activeFilter, setActiveFilter] = useState<string>('All')

  useEffect(() => {
    if (!activeSessionId) return
    api.sources
      .getSources(activeSessionId)
      .then((srcs: SourceItem[]) => {
        if (srcs && srcs.length > 0) {
          setLiveSources(srcs)
        }
      })
      .catch(() => {})
  }, [activeSessionId])

  const sources = propsSources || (liveSources.length > 0 ? liveSources : [])

  const filteredSources = sources.filter((src) => {
    if (activeFilter === 'Verified') return src.verification_status === 'Verified'
    if (activeFilter === 'High Relevance') return src.relevance_score >= 90
    if (activeFilter === 'Research Papers') return src.source_type === 'Research Paper'
    if (activeFilter === 'Government') return src.source_type === 'Government'
    return true
  })

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
      {/* Header & Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Globe size={18} className="text-blue-600" />
            Retrieved Research Sources ({sources.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified web research, academic papers, & government documents
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <Filter size={12} className="text-slate-400 ml-1.5" />
          {['All', 'Verified', 'High Relevance', 'Research Papers', 'Government'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={clsx(
                'px-2.5 py-1 rounded-lg font-semibold transition-all text-xs',
                activeFilter === filter
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Sources List Grid */}
      <div className="space-y-3">
        {filteredSources.map((source) => (
          <div
            key={source.id}
            className="p-4 rounded-xl bg-slate-50/60 border border-slate-200 hover:border-slate-300 transition-all space-y-2.5 group"
          >
            {/* Title & Domain Bar */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <SourceTypeBadge type={source.source_type} />
                  <VerificationBadge status={source.verification_status} />
                  <span className="text-[11px] font-mono text-slate-500">{source.domain}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {source.title}
                </h3>
              </div>

              {/* External Link Action */}
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white text-slate-700 hover:text-blue-600 hover:border-blue-600 border border-slate-300 transition-all flex items-center gap-1 text-xs font-semibold flex-shrink-0"
              >
                <span>Open Source</span>
                <ExternalLink size={13} />
              </a>
            </div>

            {/* Excerpt */}
            <p className="text-xs text-slate-700 leading-relaxed italic bg-white p-3 rounded-lg border border-slate-200">
              "{source.excerpt}"
            </p>

            {/* Scores & Metadata Footer */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-4">
                <span>
                  Relevance Score:{' '}
                  <strong className="text-blue-600 font-mono font-extrabold">{source.relevance_score}%</strong>
                </span>
                <span>
                  Evidence Score:{' '}
                  <strong className="text-slate-800 font-mono font-bold">{source.evidence_score}%</strong>
                </span>
              </div>
              {source.authors && (
                <span className="text-[11px] text-slate-500">
                  {source.authors.join(', ')} ({source.publication_date || 'Recent'})
                </span>
              )}
            </div>
          </div>
        ))}

        {filteredSources.length === 0 && (
          <div className="text-center py-10 text-xs text-slate-400">
            No sources match the selected filter.
          </div>
        )}
      </div>
    </div>
  )
}
