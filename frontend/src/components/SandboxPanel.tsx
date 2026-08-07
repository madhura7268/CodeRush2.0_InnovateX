/**
 * SandboxPanel — Isolated Code Execution Monitor
 *
 * Color Palette: White + Royal Blue (#2563EB)
 * - Execution progress, CPU, Memory, Active execution: Royal Blue #2563EB
 * - Completed / Secure: Green #16A34A
 */

import { useState } from 'react'
import { Terminal, Cpu, HardDrive, Shield, CheckCircle2, Loader2, Code, ChevronDown, ChevronUp } from 'lucide-react'
import { MOCK_SANDBOX_EXECUTION } from '@/services/mockData'
import type { SandboxExecution } from '@/types'
import clsx from 'clsx'

interface SandboxPanelProps {
  execution?: SandboxExecution
}

export default function SandboxPanel({ execution = MOCK_SANDBOX_EXECUTION }: SandboxPanelProps) {
  const [showLogs, setShowLogs] = useState(true)

  const isRunning = execution.status === 'Running'
  const isCompleted = execution.status === 'Completed'

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
      {/* Header & Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Terminal size={18} className="text-blue-600" />
            Sandbox Execution Environment
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Isolated Docker container runtime for benchmarking algorithms & data scripts
          </p>
        </div>

        {/* Status Badge */}
        <div
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border',
            isRunning
              ? 'bg-blue-50 text-blue-600 border-blue-200'
              : isCompleted
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          )}
        >
          {isRunning && <Loader2 size={12} className="animate-spin text-blue-600" />}
          {isCompleted && <CheckCircle2 size={12} className="text-emerald-600" />}
          <span>{execution.status}</span>
        </div>
      </div>

      {/* Task Summary & Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Execution Time */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Exec Time</span>
            <Code size={13} className="text-blue-600" />
          </div>
          <p className="text-lg font-bold font-mono text-slate-900">
            {execution.execution_time_seconds.toFixed(2)}s
          </p>
        </div>

        {/* Memory Usage (Royal Blue) */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Memory</span>
            <HardDrive size={13} className="text-blue-600" />
          </div>
          <p className="text-lg font-bold font-mono text-blue-600">
            {execution.memory_mb} MB
          </p>
        </div>

        {/* CPU Load (Royal Blue) */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">CPU Usage</span>
            <Cpu size={13} className="text-blue-600" />
          </div>
          <p className="text-lg font-bold font-mono text-blue-600">
            {execution.cpu_percent.toFixed(1)}%
          </p>
        </div>

        {/* Network Status (Green) */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Network</span>
            <Shield size={13} className="text-emerald-600" />
          </div>
          <p className="text-sm font-bold font-mono text-emerald-600 pt-1">
            {execution.network_status}
          </p>
        </div>
      </div>

      {/* Executed Task Name & Command */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Target Experiment Task</p>
        <p className="text-xs text-slate-900 font-bold">{execution.task_name}</p>
        <div className="bg-white p-2.5 rounded-lg border border-slate-300 font-mono text-xs text-blue-700 overflow-x-auto font-semibold">
          $ {execution.command}
        </div>
      </div>

      {/* Terminal Log Viewer */}
      <div className="space-y-2">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center justify-between w-full text-xs font-bold text-slate-700 hover:text-blue-600 uppercase tracking-wider transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Terminal size={14} className="text-blue-600" /> Execution Terminal Logs ({execution.logs.length})
          </span>
          <span className="flex items-center gap-1 text-slate-500 text-[11px]">
            {showLogs ? 'Hide Logs' : 'View Logs'}
            {showLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </button>

        {showLogs && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-[11px] space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar">
            {execution.logs.map((line, idx) => (
              <div key={idx} className="leading-relaxed hover:bg-slate-800 px-1 rounded">
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
