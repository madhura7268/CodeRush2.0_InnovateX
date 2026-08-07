/**
 * Settings Page — Frontend-Visible Research Configuration & System Preferences
 *
 * Color Palette: White + Royal Blue (#2563EB)
 */

import { Settings as SettingsIcon, Sliders, Database, Terminal, Globe, Layers, ShieldCheck } from 'lucide-react'
import { useAgent } from '@/contexts/AgentContext'
import { USE_MOCK_DATA } from '@/services/api'
import type { ResearchDepth } from '@/types'

export default function SettingsPage() {
  const { state, dispatch } = useAgent()
  const { config } = state

  return (
    <div className="space-y-6 animate-fade-in pb-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <SettingsIcon size={22} className="text-blue-600" />
          System <span className="text-blue-600">Settings</span> & Agent Preferences
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure default autonomous research loop parameters & backend connectivity.
        </p>
      </div>

      {/* Backend Mode Status Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Execution Mode Status</h2>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
              USE_MOCK_DATA
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {USE_MOCK_DATA ? 'Demo / Mock API Active' : 'Live FastAPI Backend Active'}
          </span>
        </div>
        <p className="text-xs text-slate-600">
          When mock mode is enabled, the frontend renders demonstration data without requiring the backend FastAPI service to be running.
        </p>
      </div>

      {/* Main Parameters Configuration Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Sliders size={18} className="text-blue-600" />
          Default Research Loop Parameters
        </h2>

        <div className="space-y-5">
          {/* Research Depth */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Default Research Depth
            </label>
            <select
              value={config.research_depth}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_CONFIG',
                  payload: { research_depth: e.target.value as ResearchDepth },
                })
              }
              className="w-full max-w-md bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            >
              <option value="standard">Standard — Quick single-pass analysis</option>
              <option value="deep">Deep — Multi-query search with RAG lookup (Recommended)</option>
              <option value="exhaustive">Exhaustive — Multi-source verification & deep sandbox benchmarking</option>
            </select>
          </div>

          {/* Max Iterations */}
          <div className="space-y-2 max-w-md">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-700 uppercase tracking-wider">
                Maximum Iterations Limit
              </label>
              <span className="font-mono font-bold text-blue-600 text-sm">
                {config.max_iterations} loops
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={config.max_iterations}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_CONFIG',
                  payload: { max_iterations: parseInt(e.target.value, 10) },
                })
              }
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Limits how many self-improving research loops the agent can perform before stopping.
            </p>
          </div>

          {/* Confidence Threshold */}
          <div className="space-y-2 max-w-md pt-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-700 uppercase tracking-wider">
                Target Confidence Threshold
              </label>
              <span className="font-mono font-bold text-emerald-600 text-sm">
                {config.confidence_threshold}%
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={95}
              step={5}
              value={config.confidence_threshold}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_CONFIG',
                  payload: { confidence_threshold: parseInt(e.target.value, 10) },
                })
              }
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              If evaluator confidence score reaches or exceeds this threshold, research stops and generates report.
            </p>
          </div>

          {/* Capability Feature Toggles */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Agent Capabilities & Tool Permissions
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:border-blue-300 transition-all">
                <div className="flex items-center gap-2 text-xs text-slate-900 font-semibold">
                  <Globe size={16} className="text-blue-600" />
                  <span>Enable Live Web Search</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.enable_web_search}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_CONFIG',
                      payload: { enable_web_search: e.target.checked },
                    })
                  }
                  className="rounded accent-blue-600 w-4 h-4"
                />
              </label>

              <label className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:border-blue-300 transition-all">
                <div className="flex items-center gap-2 text-xs text-slate-900 font-semibold">
                  <Layers size={16} className="text-blue-600" />
                  <span>Enable Headless Browser Scraper</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.enable_browser}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_CONFIG',
                      payload: { enable_browser: e.target.checked },
                    })
                  }
                  className="rounded accent-blue-600 w-4 h-4"
                />
              </label>

              <label className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:border-blue-300 transition-all">
                <div className="flex items-center gap-2 text-xs text-slate-900 font-semibold">
                  <Database size={16} className="text-blue-600" />
                  <span>Enable RAG Vector Memory</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.enable_rag}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_CONFIG',
                      payload: { enable_rag: e.target.checked },
                    })
                  }
                  className="rounded accent-blue-600 w-4 h-4"
                />
              </label>

              <label className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:border-blue-300 transition-all">
                <div className="flex items-center gap-2 text-xs text-slate-900 font-semibold">
                  <Terminal size={16} className="text-blue-600" />
                  <span>Enable Sandbox Code Exec</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.enable_sandbox}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_CONFIG',
                      payload: { enable_sandbox: e.target.checked },
                    })
                  }
                  className="rounded accent-blue-600 w-4 h-4"
                />
              </label>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
