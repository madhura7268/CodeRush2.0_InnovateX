/**
 * WorkflowTimeline — Autonomous Agent Workflow Visualizer
 *
 * Color Palette: White + Royal Blue (#2563EB)
 * States:
 * - Completed: Node #16A34A, Background #F0FDF4, Border #BBF7D0
 * - Running: Node #2563EB, Background #EFF6FF, Border #BFDBFE
 * - Pending: Node #94A3B8, Background #F1F5F9, Border #E2E8F0
 * - Failed: Node #DC2626, Background #FEF2F2, Border #FECACA
 */

import { CheckCircle2, Clock, Loader2, XCircle, Sparkles, ArrowRight, RefreshCw, FileText } from 'lucide-react'
import { MOCK_WORKFLOW_NODES } from '@/services/mockData'
import type { StepStatus, WorkflowNode } from '@/types'
import clsx from 'clsx'
import { useAgent } from '@/contexts/AgentContext'

interface WorkflowTimelineProps {
  nodes?: WorkflowNode[]
  confidenceThreshold?: number
}

function NodeStatusIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
    case 'running':
      return <Loader2 size={16} className="text-blue-600 animate-spin flex-shrink-0" />
    case 'failed':
      return <XCircle size={16} className="text-red-600 flex-shrink-0" />
    default:
      return <Clock size={16} className="text-slate-400 flex-shrink-0" />
  }
}

export default function WorkflowTimeline({
  nodes = MOCK_WORKFLOW_NODES,
  confidenceThreshold = 80,
}: WorkflowTimelineProps) {
  const { state } = useAgent()
  const { activeSession } = state

  const hasRealSession = !!activeSession
  const currentStatus = activeSession?.status || 'pending'
  const currentStep = activeSession?.current_step || ''

  const getStageStatus = (stageId: string): StepStatus => {
    if (!hasRealSession) {
      return 'pending'
    }
    if (currentStatus === 'completed') {
      if (stageId === 'IMPROVE_STRATEGY') return 'skipped'
      return 'completed'
    }
    if (currentStatus === 'failed') {
      return 'failed'
    }

    switch (stageId) {
      case 'START':
        return 'completed'
      case 'PLANNER':
        if (currentStatus === 'planning') return 'running'
        return 'completed'
      case 'RESEARCH':
      case 'BROWSER_SEARCH':
        if (currentStatus === 'planning' || currentStatus === 'pending') return 'pending'
        if (currentStatus === 'running') {
          if (currentStep.toLowerCase().includes('search') || currentStep.toLowerCase().includes('browser')) return 'running'
          if (currentStep.toLowerCase().includes('memory') || currentStep.toLowerCase().includes('eval') || currentStep.toLowerCase().includes('analy')) return 'completed'
        }
        if (currentStatus === 'evaluating') return 'completed'
        return 'pending'
      case 'RAG':
        if (currentStatus === 'planning' || currentStatus === 'pending') return 'pending'
        if (currentStatus === 'running') {
          if (currentStep.toLowerCase().includes('memory') || currentStep.toLowerCase().includes('store')) return 'running'
          if (currentStep.toLowerCase().includes('eval') || currentStep.toLowerCase().includes('analy')) return 'completed'
        }
        if (currentStatus === 'evaluating') return 'completed'
        return 'pending'
      case 'ANALYZER':
        if (currentStatus === 'planning' || currentStatus === 'pending') return 'pending'
        if (currentStatus === 'running') {
          if (currentStep.toLowerCase().includes('analyze') || currentStep.toLowerCase().includes('synthesis')) return 'running'
          if (currentStep.toLowerCase().includes('eval')) return 'completed'
        }
        if (currentStatus === 'evaluating') return 'completed'
        return 'pending'
      case 'EVALUATOR':
        if (currentStatus === 'evaluating') return 'running'
        if (currentStatus === 'running' && currentStep.toLowerCase().includes('eval')) return 'running'
        return 'pending'
      case 'CONFIDENCE_CHECK':
        return 'pending'
      case 'IMPROVE_STRATEGY':
        return 'pending'
      case 'REPORT':
        return 'pending'
      default:
        return 'pending'
    }
  }

  const finalNodes = nodes !== MOCK_WORKFLOW_NODES ? nodes : (
    hasRealSession
      ? MOCK_WORKFLOW_NODES.map((node) => {
          const status = getStageStatus(node.id)
          let metrics = undefined
          if (node.id === 'PLANNER' && status === 'completed') {
            metrics = '3 steps planned'
          } else if (node.id === 'RESEARCH' && status === 'completed') {
            metrics = 'Web search done'
          } else if (node.id === 'RAG' && status === 'running') {
            metrics = 'Vector DB...'
          } else if (node.id === 'EVALUATOR' && status === 'running') {
            metrics = 'Scoring findings...'
          }
          return { ...node, status, metrics }
        })
      : MOCK_WORKFLOW_NODES.map((node) => ({ ...node, status: 'pending' as StepStatus, metrics: undefined }))
  )

  const finalConfidenceScore = hasRealSession
    ? (activeSession.overall_confidence ?? 0.0)
    : 0.0

  const finalConfidenceThreshold = hasRealSession
    ? ((activeSession.confidence_threshold ?? 0.75) * 100)
    : confidenceThreshold

  const isThresholdMet = finalConfidenceScore >= finalConfidenceThreshold

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles size={18} className="text-blue-600" />
            Agent Autonomous Workflow Execution
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dynamic node graph updated via backend state events
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-600" /> Completed
          </div>
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" /> Running
          </div>
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
            <span className="w-2 h-2 rounded-full bg-slate-400" /> Pending
          </div>
        </div>
      </div>

      {/* Main Flow Nodes Horizontal / Grid Container */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 overflow-x-auto">
        <div className="flex items-center min-w-[760px] justify-between gap-2 py-2">
          {finalNodes
            .filter((n) => !['IMPROVE_STRATEGY', 'REPORT'].includes(n.id))
            .map((node, idx, arr) => {
              const isRunning = node.status === 'running'
              const isCompleted = node.status === 'completed'
              const isFailed = node.status === 'failed'

              return (
                <div key={node.id} className="flex items-center flex-1">
                  {/* Node Box */}
                  <div
                    className={clsx(
                      'flex-1 flex flex-col items-center p-3 rounded-xl border text-center transition-all duration-150',
                      isRunning
                        ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-500/20'
                        : isCompleted
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : isFailed
                        ? 'bg-red-50 border-red-200'
                        : 'bg-slate-100/60 border-slate-200'
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <NodeStatusIcon status={node.status} />
                      <span className={clsx(
                        'text-xs font-bold tracking-wide',
                        isRunning ? 'text-blue-700' : isCompleted ? 'text-emerald-800' : 'text-slate-700'
                      )}>
                        {node.label}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 truncate max-w-[110px]">
                      {node.description}
                    </p>

                    {node.metrics && (
                      <span className="mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono bg-white text-blue-700 border border-blue-200 font-semibold">
                        {node.metrics}
                      </span>
                    )}
                  </div>

                  {/* Connector Arrow */}
                  {idx < arr.length - 1 && (
                    <ArrowRight
                      size={14}
                      className={clsx(
                        'mx-1 flex-shrink-0',
                        isCompleted ? 'text-emerald-600' : isRunning ? 'text-blue-600' : 'text-slate-400'
                      )}
                    />
                  )}
                </div>
              )
            })}
        </div>

        {/* Branching Decision Section */}
        <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Branch A: Confidence >= Threshold -> Report */}
          <div
            className={clsx(
              'p-4 rounded-xl border flex items-center justify-between transition-all',
              isThresholdMet
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-slate-100/50 border-slate-200 opacity-60'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 border border-emerald-200">
                <FileText size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Confidence ≥ {finalConfidenceThreshold}%</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Passed ({finalConfidenceScore}%)
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate & publish final structured research report
                </p>
              </div>
            </div>
            <ArrowRight size={16} className={isThresholdMet ? 'text-emerald-600' : 'text-slate-400'} />
          </div>

          {/* Branch B: Confidence < Threshold -> Self Improvement Loop */}
          <div
            className={clsx(
              'p-4 rounded-xl border flex items-center justify-between transition-all',
              !isThresholdMet
                ? 'bg-blue-50 border-blue-300'
                : 'bg-slate-100/50 border-slate-200 opacity-60'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 border border-blue-200">
                <RefreshCw size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Confidence &lt; {finalConfidenceThreshold}%</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    Self-Improve Loop
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Analyze gaps, adjust query strategy & research again
                </p>
              </div>
            </div>
            <RefreshCw size={16} className={!isThresholdMet ? 'text-blue-600 animate-spin' : 'text-slate-400'} />
          </div>

        </div>
      </div>
    </div>
  )
}
