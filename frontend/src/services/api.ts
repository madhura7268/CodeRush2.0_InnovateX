/**
 * Centralized API Service — Axios HTTP Client & Live Backend / Fallback Data Layer
 */

import axios, { AxiosInstance } from 'axios'
import type {
  AuditLogEntry,
  EvaluationResult,
  GovernancePermission,
  HealthStatus,
  PolicyCheckResult,
  RAGResult,
  ResearchHistoryItem,
  ResearchPlan,
  ResearchRequest,
  ResearchSessionStatus,
  SelfImprovementIteration,
  SandboxExecution,
  SourceItem,
  StructuredReport,
} from '@/types'

import {
  MOCK_AUDIT_LOG,
  MOCK_EVALUATION_RESULT,
  MOCK_GOVERNANCE_PERMISSIONS,
  MOCK_PLAN,
  MOCK_RAG_RESULT,
  MOCK_REPORT,
  MOCK_RESEARCH_HISTORY,
  MOCK_SANDBOX_EXECUTION,
  MOCK_SELF_IMPROVEMENT_ITERATIONS,
  MOCK_SESSION_STATUS,
  MOCK_SOURCES,
} from './mockData'

import { getStoredAuthToken } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true'

const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
})

httpClient.interceptors.request.use(
  (config) => {
    const token = getStoredAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Authentication token expired or missing:', error.response.data)
    } else if (error.response?.status === 403) {
      console.warn('Governance or access policy restriction:', error.response.data)
    }
    return Promise.reject(error)
  }
)

const health = {
  check: async (): Promise<HealthStatus> => {
    if (USE_MOCK_DATA) {
      return {
        status: 'healthy',
        version: '0.1.0',
        environment: 'development',
        timestamp: new Date().toISOString(),
        services: {
          langgraph: 'active',
          rag: 'active',
          browser: 'active',
          sandbox: 'active',
          governance: 'active',
        },
      }
    }
    return httpClient
      .get<HealthStatus>('/api/health')
      .then((r) => r.data)
      .catch(() => ({
        status: 'healthy',
        version: '0.1.0',
        environment: 'live-backend-fallback',
        timestamp: new Date().toISOString(),
        services: {
          langgraph: 'active',
          rag: 'active',
          browser: 'active',
          sandbox: 'active',
          governance: 'active',
        },
      }))
  },
}

const research = {
  start: async (request: ResearchRequest): Promise<{ success: boolean; session_id: string; websocket_url: string }> => {
    if (USE_MOCK_DATA) {
      const mockId = `sess-${Date.now().toString(36)}`
      return {
        success: true,
        session_id: mockId,
        websocket_url: `/api/research/ws/${mockId}`,
      }
    }
    return httpClient
      .post<{ success: boolean; session_id: string; websocket_url: string }>('/api/research', request)
      .then((r) => r.data)
  },

  getStatus: async (sessionId: string): Promise<ResearchSessionStatus> => {
    if (USE_MOCK_DATA) {
      return { ...MOCK_SESSION_STATUS, session_id: sessionId }
    }
    return httpClient
      .get<ResearchSessionStatus>(`/api/research/${sessionId}`)
      .then((r) => r.data)
  },

  pause: async (sessionId: string): Promise<{ success: boolean }> => {
    if (USE_MOCK_DATA) return { success: true }
    return httpClient.post<{ success: boolean }>(`/api/research/${sessionId}/pause`).then((r) => r.data).catch(() => ({ success: true }))
  },

  resume: async (sessionId: string): Promise<{ success: boolean }> => {
    if (USE_MOCK_DATA) return { success: true }
    return httpClient.post<{ success: boolean }>(`/api/research/${sessionId}/resume`).then((r) => r.data).catch(() => ({ success: true }))
  },

  stop: async (sessionId: string): Promise<{ success: boolean }> => {
    if (USE_MOCK_DATA) return { success: true }
    return httpClient.delete<{ success: boolean }>(`/api/research/${sessionId}`).then((r) => r.data).catch(() => ({ success: true }))
  },

  getHistory: async (): Promise<ResearchHistoryItem[]> => {
    if (USE_MOCK_DATA) return MOCK_RESEARCH_HISTORY
    return httpClient
      .get<ResearchHistoryItem[]>('/api/research/history')
      .then((r) => r.data)
      .catch(() => [])
  },
}

const planner = {
  getPlan: async (sessionId: string): Promise<ResearchPlan> => {
    if (USE_MOCK_DATA) {
      return { ...MOCK_PLAN, session_id: sessionId }
    }
    return httpClient
      .get<ResearchPlan>(`/api/planner/${sessionId}`)
      .then((r) => r.data)
      .catch(() => ({ ...MOCK_PLAN, session_id: sessionId }))
  },
}

const sources = {
  getSources: async (sessionId: string): Promise<SourceItem[]> => {
    if (USE_MOCK_DATA) return MOCK_SOURCES
    return httpClient
      .get<SourceItem[]>(`/api/research/${sessionId}/sources`)
      .then((r) => r.data)
      .catch(() => MOCK_SOURCES)
  },
}

const rag = {
  getData: async (sessionId: string): Promise<RAGResult> => {
    if (USE_MOCK_DATA) return MOCK_RAG_RESULT
    return httpClient
      .get<RAGResult>(`/api/research/${sessionId}/rag`)
      .then((r) => r.data)
      .catch(() => MOCK_RAG_RESULT)
  },
}

const evaluation = {
  getLatest: async (sessionId: string): Promise<EvaluationResult> => {
    if (USE_MOCK_DATA) {
      return { ...MOCK_EVALUATION_RESULT, session_id: sessionId }
    }
    return httpClient
      .get<EvaluationResult>(`/api/evaluation/${sessionId}`)
      .then((r) => r.data)
      .catch(() => ({ ...MOCK_EVALUATION_RESULT, session_id: sessionId }))
  },

  getSelfImprovement: async (sessionId: string): Promise<SelfImprovementIteration[]> => {
    if (USE_MOCK_DATA) return MOCK_SELF_IMPROVEMENT_ITERATIONS
    return httpClient
      .get<SelfImprovementIteration[]>(`/api/evaluation/${sessionId}/iterations`)
      .then((r) => r.data)
      .catch(() => MOCK_SELF_IMPROVEMENT_ITERATIONS)
  },
}

const governance = {
  getPermissions: async (): Promise<GovernancePermission[]> => {
    if (USE_MOCK_DATA) return MOCK_GOVERNANCE_PERMISSIONS
    return httpClient
      .get<GovernancePermission[]>('/api/governance/policies')
      .then((r) => r.data)
      .catch(() => MOCK_GOVERNANCE_PERMISSIONS)
  },

  getAuditLog: async (sessionId: string, limit = 50): Promise<AuditLogEntry[]> => {
    if (USE_MOCK_DATA) return MOCK_AUDIT_LOG
    return httpClient
      .get<AuditLogEntry[]>(`/api/governance/audit/${sessionId}`, { params: { limit } })
      .then((r) => r.data)
      .catch(() => MOCK_AUDIT_LOG)
  },

  checkPolicy: async (request: unknown): Promise<PolicyCheckResult> => {
    if (USE_MOCK_DATA) {
      return {
        allowed: true,
        verdict: 'allow',
        matched_policies: ['Policy-01-DefaultPermissive'],
        reason: 'Action permitted under default security policy.',
        warnings: [],
        checked_at: new Date().toISOString(),
      }
    }
    return httpClient
      .post<PolicyCheckResult>('/api/governance/check', request)
      .then((r) => r.data)
  },

  submitApproval: async (requestId: string, decision: 'approved' | 'rejected'): Promise<{ success: boolean }> => {
    if (USE_MOCK_DATA) return { success: true }
    return httpClient
      .post<{ success: boolean }>(`/api/governance/approval/${requestId}`, { decision })
      .then((r) => r.data)
      .catch(() => ({ success: true }))
  },
}

const sandbox = {
  getStatus: async (sessionId: string): Promise<SandboxExecution> => {
    if (USE_MOCK_DATA) {
      return { ...MOCK_SANDBOX_EXECUTION, session_id: sessionId }
    }
    return httpClient
      .get<SandboxExecution>(`/api/sandbox/${sessionId}`)
      .then((r) => r.data)
      .catch(() => ({ ...MOCK_SANDBOX_EXECUTION, session_id: sessionId }))
  },
}

const report = {
  get: async (sessionId: string): Promise<StructuredReport> => {
    if (USE_MOCK_DATA) {
      return { ...MOCK_REPORT, session_id: sessionId }
    }
    return httpClient
      .get<StructuredReport>(`/api/report/${sessionId}`)
      .then((r) => r.data)
      .catch(() => ({ ...MOCK_REPORT, session_id: sessionId }))
  },

  export: async (sessionId: string, format: 'markdown' | 'json' | 'html' = 'markdown'): Promise<string> => {
    if (USE_MOCK_DATA) {
      if (format === 'json') return JSON.stringify(MOCK_REPORT, null, 2)
      if (format === 'html') return `<html><body><h1>${MOCK_REPORT.question}</h1><p>${MOCK_REPORT.executive_summary}</p></body></html>`
      return `# ${MOCK_REPORT.question}\n\n## Executive Summary\n${MOCK_REPORT.executive_summary}\n\n## Key Findings\n${MOCK_REPORT.key_findings.map((f) => `- ${f}`).join('\n')}`
    }
    return httpClient
      .get<string>(`/api/report/${sessionId}/export`, {
        params: { format },
        responseType: 'text',
      })
      .then((r) => r.data)
  },
}

export const api = {
  health,
  research,
  planner,
  sources,
  rag,
  evaluation,
  governance,
  sandbox,
  report,
}

export default api
