/**
 * AgentContext — Global React Context for Research Agent State
 *
 * Provides agent state (active session, health, live events) to all components.
 * Replace mock data with real API calls as modules are implemented.
 *
 * Usage:
 *   const { state, dispatch } = useAgent()
 */

import React, {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
} from 'react'
import type { ResearchSessionStatus, WebSocketEvent } from '@/types'

// ---------------------------------------------------------------------------
// State Shape
// ---------------------------------------------------------------------------
interface AgentState {
  /** Currently selected/active research session */
  activeSessionId: string | null
  /** Status of the active session */
  activeSession: ResearchSessionStatus | null
  /** Whether the backend API is reachable */
  apiHealthy: boolean
  /** Whether there is an active WebSocket connection */
  wsConnected: boolean
  /** Recent live events from WebSocket */
  liveEvents: WebSocketEvent[]
  /** Whether the sidebar is collapsed */
  sidebarCollapsed: boolean
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
type AgentAction =
  | { type: 'SET_ACTIVE_SESSION'; payload: string | null }
  | { type: 'UPDATE_SESSION_STATUS'; payload: ResearchSessionStatus }
  | { type: 'SET_API_HEALTH'; payload: boolean }
  | { type: 'SET_WS_CONNECTED'; payload: boolean }
  | { type: 'ADD_LIVE_EVENT'; payload: WebSocketEvent }
  | { type: 'CLEAR_LIVE_EVENTS' }
  | { type: 'TOGGLE_SIDEBAR' }

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
function agentReducer(state: AgentState, action: AgentAction): AgentState {
  switch (action.type) {
    case 'SET_ACTIVE_SESSION':
      return { ...state, activeSessionId: action.payload, activeSession: null }
    case 'UPDATE_SESSION_STATUS':
      return { ...state, activeSession: action.payload }
    case 'SET_API_HEALTH':
      return { ...state, apiHealthy: action.payload }
    case 'SET_WS_CONNECTED':
      return { ...state, wsConnected: action.payload }
    case 'ADD_LIVE_EVENT':
      return {
        ...state,
        liveEvents: [action.payload, ...state.liveEvents].slice(0, 100), // keep last 100
      }
    case 'CLEAR_LIVE_EVENTS':
      return { ...state, liveEvents: [] }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------
const initialState: AgentState = {
  activeSessionId: null,
  activeSession: null,
  apiHealthy: false,
  wsConnected: false,
  liveEvents: [],
  sidebarCollapsed: false,
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface AgentContextValue {
  state: AgentState
  dispatch: React.Dispatch<AgentAction>
}

const AgentContext = createContext<AgentContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AgentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(agentReducer, initialState)

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
