/**
 * ResearchForm — Main research submit & configuration component.
 *
 * Color Palette: White + Royal Blue (#2563EB)
 */

import { useState } from 'react'
import {
  Search,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Square,
  Sparkles,
  Database,
  Globe,
  Terminal,
  Layers,
} from 'lucide-react'
import { useAgent } from '@/contexts/AgentContext'
import { useResearch } from '@/hooks/useResearch'
import type { ResearchDepth } from '@/types'

const SAMPLE_QUESTIONS = [
  'Is AI-based pothole detection practical for Indian roads?',
  'What are the latest breakthroughs in quantum error correction surface codes?',
  'How does CRISPR-Cas9 compare to base editing techniques in clinical accuracy?',
  'What are the economic impacts of large language models on knowledge work?',
]

export default function ResearchForm() {
  const { state, dispatch } = useAgent()
  const { config, activeSession, systemStatus } = state
  const { isLoading, error, startResearch, pauseResearch, resumeResearch, stopResearch } = useResearch()

  const [question, setQuestion] = useState(activeSession?.question || '')
  const [showConfig, setShowConfig] = useState(false)

  const isRunning = systemStatus === 'Researching'
  const isPaused = systemStatus === 'Paused'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || question.length < 10) return

    await startResearch({
      question: question.trim(),
      max_iterations: config.max_iterations,
      confidence_threshold: config.confidence_threshold / 100,
      research_depth: config.research_depth,
      enable_web_search: config.enable_web_search,
      enable_browser: config.enable_browser,
      enable_rag: config.enable_rag,
      enable_sandbox: config.enable_sandbox,
    })
  }

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
      {/* Header title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search size={18} className="text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Autonomous Research Query</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            showConfig
              ? 'bg-blue-50 text-blue-600 border-blue-200'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-blue-600'
          }`}
        >
          <Sliders size={13} />
          <span>Config</span>
        </button>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            id="research-question-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isRunning}
            placeholder="Enter research question... e.g. 'Is AI-based pothole detection practical for Indian roads?'"
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 disabled:opacity-60 resize-none transition-all"
          />
        </div>

        {/* Sample prompt pills */}
        {!isRunning && (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Sparkles size={11} className="text-blue-600" /> Quick Prompts:
            </span>
            {SAMPLE_QUESTIONS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setQuestion(prompt)}
                className="px-3 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-slate-200 transition-all text-left truncate max-w-xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Advanced Configuration Panel */}
        {showConfig && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 animate-fade-in">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Research Agent Configuration
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Depth Selector */}
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">Research Depth</label>
                <select
                  value={config.research_depth}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_CONFIG',
                      payload: { research_depth: e.target.value as ResearchDepth },
                    })
                  }
                  disabled={isRunning}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="standard">Standard (Fast analysis)</option>
                  <option value="deep">Deep (Comprehensive search & RAG)</option>
                  <option value="exhaustive">Exhaustive (Multi-source verification)</option>
                </select>
              </div>

              {/* Max Iterations Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-slate-600 font-medium">Max Iterations</label>
                  <span className="text-xs font-mono font-bold text-blue-600">
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
                  disabled={isRunning}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Confidence Threshold Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-slate-600 font-medium">Confidence Threshold</label>
                  <span className="text-xs font-mono font-bold text-emerald-600">
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
                  disabled={isRunning}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={config.enable_web_search}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_CONFIG',
                      payload: { enable_web_search: e.target.checked },
                    })
                  }
                  disabled={isRunning}
                  className="rounded accent-blue-600"
                />
                <Globe size={13} className="text-blue-600" />
                <span>Web Search</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={config.enable_browser}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_CONFIG',
                      payload: { enable_browser: e.target.checked },
                    })
                  }
                  disabled={isRunning}
                  className="rounded accent-blue-600"
                />
                <Layers size={13} className="text-blue-600" />
                <span>Browser Scraper</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={config.enable_rag}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_CONFIG',
                      payload: { enable_rag: e.target.checked },
                    })
                  }
                  disabled={isRunning}
                  className="rounded accent-blue-600"
                />
                <Database size={13} className="text-blue-600" />
                <span>RAG Memory</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={config.enable_sandbox}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_CONFIG',
                      payload: { enable_sandbox: e.target.checked },
                    })
                  }
                  disabled={isRunning}
                  className="rounded accent-blue-600"
                />
                <Terminal size={13} className="text-blue-600" />
                <span>Sandbox Exec</span>
              </label>
            </div>
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            {question.length}/2000 chars · Min 10 chars
          </p>

          <div className="flex items-center gap-2">
            {!isRunning && !isPaused ? (
              <button
                id="start-research-btn"
                type="submit"
                disabled={isLoading || question.length < 10}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play size={14} />
                {isLoading ? 'Starting...' : 'Start Research'}
              </button>
            ) : (
              <>
                {isRunning && (
                  <button
                    type="button"
                    onClick={pauseResearch}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 flex items-center gap-1.5 transition-colors"
                  >
                    <Pause size={13} />
                    Pause
                  </button>
                )}

                {isPaused && (
                  <button
                    type="button"
                    onClick={resumeResearch}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw size={13} />
                    Resume
                  </button>
                )}

                <button
                  type="button"
                  onClick={stopResearch}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 flex items-center gap-1.5 transition-colors"
                >
                  <Square size={13} />
                  Stop Session
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
            {error}
          </p>
        )}
      </form>
    </div>
  )
}
