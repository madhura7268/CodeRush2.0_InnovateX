/**
 * RagPanel — RAG Vector Database Information Component
 *
 * Color Palette: White + Royal Blue (#2563EB)
 * - Similarity score: #2563EB
 * - Retrieval progress & metrics: #2563EB
 */

import { Database, FileText, Zap, Layers } from 'lucide-react'
import { MOCK_RAG_RESULT } from '@/services/mockData'
import type { RAGResult } from '@/types'

interface RagPanelProps {
  ragResult?: RAGResult
}

export default function RagPanel({ ragResult = MOCK_RAG_RESULT }: RagPanelProps) {
  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
      {/* Header & Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database size={18} className="text-blue-600" />
            RAG Internal Knowledge Base Retrieval
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ChromaDB vector embedding search results from indexed institutional documents
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Docs</span>
            <span className="text-xs font-bold text-slate-900 font-mono">{ragResult.documents_retrieved}</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Chunks</span>
            <span className="text-xs font-bold text-blue-600 font-mono">{ragResult.chunks_retrieved}</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Latency</span>
            <span className="text-xs font-bold text-emerald-600 font-mono">{ragResult.retrieval_time_ms} ms</span>
          </div>
        </div>
      </div>

      {/* Top Chunks List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Layers size={13} className="text-blue-600" />
          Top Relevant Chunks
        </h3>

        {ragResult.top_chunks.map((chunk) => (
          <div
            key={chunk.chunk_id}
            className="p-4 rounded-xl bg-slate-50/60 border border-slate-200 space-y-2 hover:border-blue-300 transition-all"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-blue-600" />
                <span className="text-xs font-bold text-slate-900">{chunk.document_name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono font-semibold">
                  {chunk.document_type}
                </span>
              </div>

              {/* Similarity Score Pill (Royal Blue) */}
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-xs font-mono font-bold">
                <Zap size={10} />
                <span>Similarity: {chunk.similarity_score.toFixed(2)}</span>
              </div>
            </div>

            {/* Chunk Content */}
            <p className="text-xs text-slate-700 leading-relaxed font-sans bg-white p-3 rounded-lg border border-slate-200">
              {chunk.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
