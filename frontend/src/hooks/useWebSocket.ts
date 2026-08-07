/**
 * useWebSocket — Custom hook for managing WebSocket connections.
 */

import { useEffect, useState } from 'react'
import webSocketService from '@/services/websocket'
import { useAgent } from '@/contexts/AgentContext'
import type { ActivityEvent, WebSocketEvent } from '@/types'

interface UseWebSocketReturn {
  isConnected: boolean
  lastEvent: WebSocketEvent | null
}

export function useWebSocket(sessionId: string | null): UseWebSocketReturn {
  const { dispatch } = useAgent()
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null)

  useEffect(() => {
    if (!sessionId) return

    webSocketService.connect(sessionId)

    const unsubStatus = webSocketService.subscribeStatus((connected) => {
      setIsConnected(connected)
      dispatch({ type: 'SET_WS_CONNECTED', payload: connected })
    })

    const unsubEvent = webSocketService.subscribe((wsEvent) => {
      setLastEvent(wsEvent)
      const event: ActivityEvent = {
        id: `evt-${Date.now()}`,
        session_id: wsEvent.session_id,
        timestamp: wsEvent.timestamp || new Date().toLocaleTimeString('en-US', { hour12: false }),
        level: wsEvent.level || 'INFO',
        message: wsEvent.message,
      }
      dispatch({ type: 'ADD_ACTIVITY_EVENT', payload: event })
    })

    return () => {
      unsubStatus()
      unsubEvent()
    }
  }, [sessionId, dispatch])

  return { isConnected, lastEvent }
}
