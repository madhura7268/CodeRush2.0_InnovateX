/**
 * Research Page — Deep Research Workspace & Analysis Hub
 *
 * Color Palette: White + Royal Blue (#2563EB)
 */

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Brain,
  Globe,
  Database,
  TrendingUp,
  Award,
  RefreshCw,
  ShieldCheck,
  Terminal,
  FileText,
  Activity,
  Layers,
} from 'lucide-react'
import { useAgent } from '@/contexts/AgentContext'
import ResearchPlanComponent from '@/components/ResearchPlan'
import WorkflowTimeline from '@/components/WorkflowTimeline'
import LiveActivityPanel from '@/components/LiveActivityPanel'
import SourcesPanel from '@/components/SourcesPanel'
import RagPanel from '@/components/RagPanel'
import ConfidencePanel from '@/components/ConfidencePanel'
import EvaluationPanel from '@/components/EvaluationPanel'
import SelfImprovementPanel from '@/components/SelfImprovementPanel'
import GovernancePanel from '@/components/GovernancePanel'
import SandboxPanel from '@/components/SandboxPanel'
import ReportViewer from '@/components/ReportViewer'
import HumanApprovalModal from '@/components/HumanApprovalModal'
import StatusBadge from '@/components/StatusBadge'
import clsx from 'clsx'

export default function Research() {
  const { sessionId } = useParams()
  const { state } = useAgent()
  const { activeSession } = state

  const [activeTab, setActiveTab] = useState<string>('plan')

  const tabs = [
    { id: 'plan', label: 'Plan & Steps', icon: Brain },
    { id: 'workflow', label: 'Workflow Graph', icon: Layers },
    { id: 'activity', label: 'Live Stream', icon: Activity },
    { id: 'sources', label: 'Sources (12)', icon: Globe },
    { id: 'rag', label: 'RAG Memory', icon: Database },
    { id: 'confidence', label: 'Confidence (86.5%)', icon: TrendingUp },
    { id: 'evaluation', label: 'Evaluation', icon: Award },
    { id: 'self-improvement', label: 'Self-Improvement', icon: RefreshCw },
    { id: 'governance', label: 'Governance', icon: ShieldCheck },
    { id: 'sandbox', label: 'Sandbox Exec', icon: Terminal },
    { id: 'report', label: 'Final Report', icon: FileText },
  ]

  const currentSessionId = sessionId || activeSession?.session_id || 'sess-pothole-002'

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <HumanApprovalModal />

      {/* Header Overview Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-600">
                Session: {currentSessionId}
              </span>
              {activeSession && <StatusBadge status={activeSession.status} />}
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              {activeSession?.question || 'Is AI-based pothole detection practical for Indian roads?'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Iteration</span>
              <span className="text-xs font-bold text-blue-600 font-mono">
                {activeSession?.current_iteration || 2} / {activeSession?.max_iterations || 3}
              </span>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Confidence</span>
              <span className="text-xs font-bold text-emerald-600 font-mono">86.5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border',
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300'
              )}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content Display */}
      <div className="space-y-6">
        {activeTab === 'plan' && <ResearchPlanComponent />}
        {activeTab === 'workflow' && <WorkflowTimeline />}
        {activeTab === 'activity' && <LiveActivityPanel />}
        {activeTab === 'sources' && <SourcesPanel />}
        {activeTab === 'rag' && <RagPanel />}
        {activeTab === 'confidence' && <ConfidencePanel />}
        {activeTab === 'evaluation' && <EvaluationPanel />}
        {activeTab === 'self-improvement' && <SelfImprovementPanel />}
        {activeTab === 'governance' && <GovernancePanel />}
        {activeTab === 'sandbox' && <SandboxPanel />}
        {activeTab === 'report' && <ReportViewer />}
      </div>
    </div>
  )
}
