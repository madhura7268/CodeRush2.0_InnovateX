/**
 * useResearch — Custom hook for research session management.
 *
 * Wraps API calls for starting, monitoring, pausing, resuming, and stopping research sessions.
 */

import { useState, useCallback, useRef } from 'react'
import { api } from '@/services/api'
import { useAgent } from '@/contexts/AgentContext'
import type { ResearchRequest, ResearchSessionStatus } from '@/types'

interface UseResearchReturn {
  isLoading: boolean
  error: string | null
  startResearch: (request: ResearchRequest) => Promise<string | null>
  pauseResearch: () => Promise<void>
  resumeResearch: () => Promise<void>
  stopResearch: () => Promise<void>
  cancelResearch: (sessionId: string) => Promise<void>
  refreshStatus: (sessionId: string) => Promise<ResearchSessionStatus | null>
}

export function useResearch(): UseResearchReturn {
  const { state, dispatch } = useAgent()
  const { activeSessionId } = state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isSubmittingRef = useRef(false)

  const startResearch = useCallback(
    async (request: ResearchRequest): Promise<string | null> => {
      if (isSubmittingRef.current) return null
      isSubmittingRef.current = true
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
        isSubmittingRef.current = false
      }
    },
    [dispatch]
  )

  const pauseResearch = useCallback(async () => {
    if (!activeSessionId) return
    try {
      await api.research.pause(activeSessionId)
      dispatch({ type: 'SET_SYSTEM_STATUS', payload: 'Paused' })
    } catch {
      setError('Failed to pause research')
    }
  }, [activeSessionId, dispatch])

  const resumeResearch = useCallback(async () => {
    if (!activeSessionId) return
    try {
      await api.research.resume(activeSessionId)
      dispatch({ type: 'SET_SYSTEM_STATUS', payload: 'Researching' })
    } catch {
      setError('Failed to resume research')
    }
  }, [activeSessionId, dispatch])

  const stopResearch = useCallback(async () => {
    if (!activeSessionId) return
    try {
      await api.research.stop(activeSessionId)
      dispatch({ type: 'SET_SYSTEM_STATUS', payload: 'Completed' })
    } catch {
      setError('Failed to stop research')
    }
  }, [activeSessionId, dispatch])

  const cancelResearch = useCallback(async (sessionId: string) => {
    try {
      await api.research.stop(sessionId)
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

  return {
    isLoading,
    error,
    startResearch,
    pauseResearch,
    resumeResearch,
    stopResearch,
    cancelResearch,
    refreshStatus,
  }
}
