/**
 * AgentContext — Global State Provider for AE-02 Research Agent
 *
 * Manages:
 * - System status (Online, Researching, Completed, Paused, Error)
 * - Active research session status, plan, & metrics
 * - Configuration parameters (iterations, threshold, depth, toggles)
 * - Live activity events log feed
 * - Human-in-the-loop approval modal trigger state
 * - Research history list
 * - WebSocket connectivity state
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from 'react'
import type {
  ActivityEvent,
  HumanApprovalRequest,
  ResearchConfig,
  ResearchHistoryItem,
  ResearchSessionStatus,
  SystemStatus,
  WebSocketEvent,
} from '@/types'
import { api } from '@/services/api'
import webSocketService from '@/services/websocket'

// ---------------------------------------------------------------------------
// State Shape
// ---------------------------------------------------------------------------
interface AgentState {
  systemStatus: SystemStatus
  activeSessionId: string | null
  activeSession: ResearchSessionStatus | null
  config: ResearchConfig
  apiHealthy: boolean
  wsConnected: boolean
  liveEvents: ActivityEvent[]
  pendingApproval: HumanApprovalRequest | null
  history: ResearchHistoryItem[]
  sidebarCollapsed: boolean
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
type AgentAction =
  | { type: 'SET_SYSTEM_STATUS'; payload: SystemStatus }
  | { type: 'SET_ACTIVE_SESSION'; payload: string | null }
  | { type: 'UPDATE_SESSION_STATUS'; payload: ResearchSessionStatus }
  | { type: 'UPDATE_CONFIG'; payload: Partial<ResearchConfig> }
  | { type: 'SET_API_HEALTH'; payload: boolean }
  | { type: 'SET_WS_CONNECTED'; payload: boolean }
  | { type: 'ADD_ACTIVITY_EVENT'; payload: ActivityEvent }
  | { type: 'CLEAR_ACTIVITY_EVENTS' }
  | { type: 'SET_PENDING_APPROVAL'; payload: HumanApprovalRequest | null }
  | { type: 'SET_HISTORY'; payload: ResearchHistoryItem[] }
  | { type: 'TOGGLE_SIDEBAR' }

// ---------------------------------------------------------------------------
// Default Configuration
// ---------------------------------------------------------------------------
const defaultConfig: ResearchConfig = {
  max_iterations: 3,
  confidence_threshold: 80,
  research_depth: 'deep',
  enable_web_search: true,
  enable_browser: true,
  enable_rag: true,
  enable_sandbox: true,
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
function agentReducer(state: AgentState, action: AgentAction): AgentState {
  switch (action.type) {
    case 'SET_SYSTEM_STATUS':
      return { ...state, systemStatus: action.payload }

    case 'SET_ACTIVE_SESSION':
      return {
        ...state,
        activeSessionId: action.payload,
        systemStatus: action.payload ? 'Researching' : 'Online',
      }

    case 'UPDATE_SESSION_STATUS': {
      const session = action.payload
      let sysStatus: SystemStatus = 'Researching'
      if (session.status === 'completed') sysStatus = 'Completed'
      else if (session.status === 'paused') sysStatus = 'Paused'
      else if (session.status === 'failed') sysStatus = 'Error'

      return {
        ...state,
        activeSession: session,
        systemStatus: sysStatus,
      }
    }

    case 'UPDATE_CONFIG':
      return {
        ...state,
        config: { ...state.config, ...action.payload },
      }

    case 'SET_API_HEALTH':
      return { ...state, apiHealthy: action.payload }

    case 'SET_WS_CONNECTED':
      return { ...state, wsConnected: action.payload }

    case 'ADD_ACTIVITY_EVENT':
      return {
        ...state,
        liveEvents: [action.payload, ...state.liveEvents].slice(0, 150),
      }

    case 'CLEAR_ACTIVITY_EVENTS':
      return { ...state, liveEvents: [] }

    case 'SET_PENDING_APPROVAL':
      return { ...state, pendingApproval: action.payload }

    case 'SET_HISTORY':
      return { ...state, history: action.payload }

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Initial State (Clean Live State without Static Defaults)
// ---------------------------------------------------------------------------
const initialState: AgentState = {
  systemStatus: 'Online',
  activeSessionId: null,
  activeSession: null,
  config: defaultConfig,
  apiHealthy: false,
  wsConnected: false,
  liveEvents: [],
  pendingApproval: null,
  history: [],
  sidebarCollapsed: false,
}

// ---------------------------------------------------------------------------
// Context Definition
// ---------------------------------------------------------------------------
interface AgentContextValue {
  state: AgentState
  dispatch: React.Dispatch<AgentAction>
}

const AgentContext = createContext<AgentContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider Component
// ---------------------------------------------------------------------------
export function AgentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(agentReducer, initialState)

  // Fetch initial system status and research history on mount
  useEffect(() => {
    api.health
      .check()
      .then(() => dispatch({ type: 'SET_API_HEALTH', payload: true }))
      .catch(() => dispatch({ type: 'SET_API_HEALTH', payload: false }))

    api.research
      .getHistory()
      .then((history) => dispatch({ type: 'SET_HISTORY', payload: history }))
      .catch(() => dispatch({ type: 'SET_HISTORY', payload: [] }))
  }, [])

  // Listen to WebSocket status and events
  useEffect(() => {
    const unsubscribeStatus = webSocketService.subscribeStatus((connected) => {
      dispatch({ type: 'SET_WS_CONNECTED', payload: connected })
    })

    const unsubscribeEvent = webSocketService.subscribe((wsEvent: WebSocketEvent) => {
      const event: ActivityEvent = {
        id: `evt-${Date.now()}`,
        session_id: wsEvent.session_id,
        timestamp: wsEvent.timestamp || new Date().toLocaleTimeString('en-US', { hour12: false }),
        level: wsEvent.level || (wsEvent.type.includes('failed') ? 'ERROR' : wsEvent.type.includes('completed') ? 'SUCCESS' : 'INFO'),
        message: wsEvent.message,
      }
      dispatch({ type: 'ADD_ACTIVITY_EVENT', payload: event })
    })

    return () => {
      unsubscribeStatus()
      unsubscribeEvent()
    }
  }, [])

  return (
    <AgentContext.Provider value={{ state, dispatch }}>
      {children}
    </AgentContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAgent(): AgentContextValue {
  const ctx = useContext(AgentContext)
  if (!ctx) {
    throw new Error('useAgent must be used within an <AgentProvider>')
  }
  return ctx
}
