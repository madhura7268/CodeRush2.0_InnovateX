/**
 * API Service — Axios HTTP Client
 *
 * Centralizes all API calls to the backend.
 * All methods return typed responses.
 *
 * Usage:
 *   import { api } from '@/services/api'
 *   const session = await api.research.start({ question: "..." })
 */

import axios, { AxiosInstance } from 'axios'
import type {
  AuditLogEntry,
  EvaluationResult,
  HealthStatus,
  IterationEvaluation,
  PolicyCheckResult,
  ResearchPlan,
  ResearchRequest,
  ResearchResult,
  ResearchSessionStatus,
  StructuredReport,
} from '@/types'

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const httpClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30_000,
})

// Request interceptor — add auth headers when implemented
httpClient.interceptors.request.use(
  (config) => {
    // TODO: Add Bearer token once auth is implemented
    // const token = localStorage.getItem('access_token')
    // if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle global errors
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      // Governance violation — show governance error UI
      console.error('Governance violation:', error.response.data)
    }
    return Promise.reject(error)
  }
)

// ---------------------------------------------------------------------------
// API Modules
// ---------------------------------------------------------------------------

/** Health check endpoints */
const health = {
  check: () =>
    httpClient.get<HealthStatus>('/api/health').then((r) => r.data),
}

/** Research session endpoints */
const research = {
  /** Start a new research session */
  start: (request: ResearchRequest) =>
    httpClient
      .post<{ success: boolean; session_id: string; websocket_url: string }>(
        '/api/research',
        request
      )
      .then((r) => r.data),

  /** Get session status */
  getStatus: (sessionId: string) =>
    httpClient
      .get<ResearchSessionStatus>(`/api/research/${sessionId}`)
      .then((r) => r.data),

  /** Get session result */
  getResult: (sessionId: string) =>
    httpClient
      .get<ResearchResult>(`/api/research/${sessionId}/result`)
      .then((r) => r.data),

  /** Cancel a session */
  cancel: (sessionId: string) =>
    httpClient
      .delete<{ success: boolean; session_id: string }>(
        `/api/research/${sessionId}`
      )
      .then((r) => r.data),
}

/** Planner endpoints */
const planner = {
  /** Get the research plan for a session */
  getPlan: (sessionId: string) =>
    httpClient
      .get<ResearchPlan>(`/api/planner/${sessionId}`)
      .then((r) => r.data),
}

/** Governance endpoints */
const governance = {
  /** Get audit log for a session */
  getAuditLog: (sessionId: string, limit = 50) =>
    httpClient
      .get<AuditLogEntry[]>(`/api/governance/audit/${sessionId}`, {
        params: { limit },
      })
      .then((r) => r.data),

  /** Get active policy registry */
  getPolicies: () =>
    httpClient
      .get<Record<string, unknown>>('/api/governance/policies')
      .then((r) => r.data),
}

/** Evaluation endpoints */
const evaluation = {
  /** Get latest evaluation for a session */
  getLatest: (sessionId: string) =>
    httpClient
      .get<EvaluationResult>(`/api/evaluation/${sessionId}`)
      .then((r) => r.data),

  /** Get evaluation history across all iterations */
  getHistory: (sessionId: string) =>
    httpClient
      .get<IterationEvaluation[]>(`/api/evaluation/${sessionId}/history`)
      .then((r) => r.data),

  /** Check a governance policy */
  checkPolicy: (request: unknown) =>
    httpClient
      .post<PolicyCheckResult>('/api/governance/check', request)
      .then((r) => r.data),
}

/** Report endpoints */
const report = {
  /** Get the structured report for a completed session */
  get: (sessionId: string) =>
    httpClient
      .get<StructuredReport>(`/api/report/${sessionId}`)
      .then((r) => r.data),

  /** Export report in specified format */
  export: (sessionId: string, format: 'markdown' | 'json' | 'html' = 'markdown') =>
    httpClient
      .get<string>(`/api/report/${sessionId}/export`, {
        params: { format },
        responseType: 'text',
      })
      .then((r) => r.data),
}

// ---------------------------------------------------------------------------
// WebSocket factory
// ---------------------------------------------------------------------------
/**
 * Creates a WebSocket connection for real-time research progress events.
 *
 * Usage:
 *   const ws = createWebSocket(sessionId)
 *   ws.onmessage = (event) => {
 *     const data = JSON.parse(event.data)
 *     dispatch({ type: data.type, payload: data })
 *   }
 */
export function createWebSocket(sessionId: string): WebSocket {
  const wsBase = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'
  return new WebSocket(`${wsBase}/api/research/ws/${sessionId}`)
}

// ---------------------------------------------------------------------------
// Exported API client
// ---------------------------------------------------------------------------
export const api = {
  health,
  research,
  planner,
  governance,
  evaluation,
  report,
}

export default api
