/**
 * useResearch — Custom hook for research session management.
 *
 * Wraps API calls for starting, monitoring, and cancelling research sessions.
 * Handles loading states and error boundaries.
 */

import { useState, useCallback } from 'react'
import { api } from '@/services/api'
import { useAgent } from '@/contexts/AgentContext'
import type { ResearchRequest, ResearchSessionStatus } from '@/types'

interface UseResearchReturn {
  isLoading: boolean
  error: string | null
  startResearch: (request: ResearchRequest) => Promise<string | null>
  cancelResearch: (sessionId: string) => Promise<void>
  refreshStatus: (sessionId: string) => Promise<ResearchSessionStatus | null>
}

export function useResearch(): UseResearchReturn {
  const { dispatch } = useAgent()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startResearch = useCallback(
    async (request: ResearchRequest): Promise<string | null> => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await api.research.start(request)
        dispatch({ type: 'SET_ACTIVE_SESSION', payload: response.session_id })
        return response.session_id
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to start research'
        setError(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [dispatch]
  )

  const cancelResearch = useCallback(async (sessionId: string) => {
    try {
      await api.research.cancel(sessionId)
      dispatch({ type: 'SET_ACTIVE_SESSION', payload: null })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to cancel session'
      setError(message)
    }
  }, [dispatch])

  const refreshStatus = useCallback(
    async (sessionId: string): Promise<ResearchSessionStatus | null> => {
      try {
        const status = await api.research.getStatus(sessionId)
        dispatch({ type: 'UPDATE_SESSION_STATUS', payload: status })
        return status
      } catch {
        return null
      }
    },
    [dispatch]
  )

  return { isLoading, error, startResearch, cancelResearch, refreshStatus }
}
