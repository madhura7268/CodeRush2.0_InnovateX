/**
 * Landing Page — AE-02 Self-Evolving Autonomous Research Agent
 *
 * Color Palette: White + Royal Blue (#2563EB)
 */

import { useNavigate } from 'react-router-dom'
import {
  Brain,
  Globe,
  Database,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Cpu,
} from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()

  const capabilities = [
    {
      title: 'Autonomous Planning',
      description: 'The agent creates, structures, and executes a multi-step research plan automatically.',
      icon: Brain,
    },
    {
      title: 'Live Research',
      description: 'The agent uses domain-restricted web research and headless browser tools to gather evidence.',
      icon: Globe,
    },
    {
      title: 'RAG Memory',
      description: 'Retrieve relevant institutional knowledge and vector document embeddings with high precision.',
      icon: Database,
    },
    {
      title: 'Self-Improvement',
      description: 'Evaluate results, detect gaps, and improve the research strategy in multi-iteration loops.',
      icon: RefreshCw,
    },
  ]

  const workflowSteps = [
    { label: 'Question', desc: 'User Prompt' },
    { label: 'Plan', desc: 'Step Breakdown' },
    { label: 'Research', desc: 'Web & Scraper' },
    { label: 'Retrieve', desc: 'Vector RAG' },
    { label: 'Evaluate', desc: 'Confidence' },
    { label: 'Improve', desc: 'Self-Evolve' },
    { label: 'Report', desc: 'Synthesized Doc' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Cpu size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-mono">
                  AE-02
                </span>
                <span className="text-sm font-bold text-slate-900">
                  Research Agent
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 bg-white border border-slate-300 hover:border-blue-600 transition-colors"
            >
              Login
            </button>

            <button
              onClick={() => navigate('/register')}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center space-y-8 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
          <Sparkles size={14} className="text-blue-600" />
          <span>Next-Generation Autonomous Research Platform</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Self-Evolving <span className="text-blue-600">Autonomous Research Agent</span>
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Research smarter with an autonomous AI agent that can plan, browse, retrieve knowledge, evaluate evidence, and improve its research strategy.
          </p>
        </div>

        {/* Process Tagline */}
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-xs font-mono font-bold text-slate-700">
          <span>Plan</span>
          <span className="text-blue-600">→</span>
          <span>Research</span>
          <span className="text-blue-600">→</span>
          <span>Evaluate</span>
          <span className="text-blue-600">→</span>
          <span>Improve</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>Get Started</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3.5 rounded-xl font-bold text-sm text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 hover:border-blue-600 transition-colors"
          >
            Login
          </button>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-16 px-6 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Core Capabilities
            </h2>
            <p className="text-2xl font-bold text-slate-900">
              Built for Deep, Verified Research Execution
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {capabilities.map((cap) => {
              const Icon = cap.icon
              return (
                <div
                  key={cap.title}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{cap.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{cap.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            Autonomous Process
          </h2>
          <p className="text-2xl font-bold text-slate-900">How AE-02 Executes Research</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {workflowSteps.map((step, idx) => (
            <div
              key={step.label}
              className="p-3.5 rounded-xl bg-white border border-slate-200 text-center space-y-1 shadow-sm"
            >
              <span className="text-[10px] font-mono font-bold text-blue-600">0{idx + 1}</span>
              <h4 className="text-xs font-bold text-slate-900">{step.label}</h4>
              <p className="text-[10px] text-slate-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Governance Section */}
      <section className="py-16 px-6 bg-white border-y border-slate-200">
        <div className="max-w-4xl mx-auto p-8 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <ShieldCheck size={14} /> Governed AI Policy Engine
            </div>
            <h3 className="text-xl font-bold text-slate-900">Governed AI & Safety Enforcement</h3>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              Agent actions are strictly controlled by security policies, sandbox container restrictions, and human-in-the-loop approval when restricted operations are requested.
            </p>
          </div>

          <div className="flex-shrink-0">
            <div className="px-4 py-2 rounded-xl bg-white border border-slate-200 font-mono text-xs font-bold text-emerald-600 shadow-sm">
              ✓ Policy Shield Active
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 text-center space-y-6">
        <h2 className="text-3xl font-extrabold text-slate-900">
          Ready to start researching?
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Experience self-evolving autonomous research with full evidence provenance and evaluation scoring.
        </p>

        <div>
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors inline-flex items-center gap-2 shadow-sm"
          >
            <span>Start Research</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white mt-auto">
        AE-02 Self-Evolving Autonomous Research Agent Platform · Built with React & Firebase Auth
      </footer>
    </div>
  )
}
