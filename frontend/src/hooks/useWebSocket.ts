/**
 * useWebSocket — Custom hook for managing WebSocket connections.
 *
 * Manages connection lifecycle, reconnection logic, and event dispatching.
 * Automatically dispatches events to AgentContext.
 *
 * Usage:
 *   const { isConnected } = useWebSocket(sessionId)
 */

import { useEffect, useRef, useState } from 'react'
import { createWebSocket } from '@/services/api'
import { useAgent } from '@/contexts/AgentContext'
import type { WebSocketEvent } from '@/types'

interface UseWebSocketReturn {
  isConnected: boolean
  lastEvent: WebSocketEvent | null
}

export function useWebSocket(sessionId: string | null): UseWebSocketReturn {
  const { dispatch } = useAgent()
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null)
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!sessionId) return

    function connect() {
      const ws = createWebSocket(sessionId!)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        dispatch({ type: 'SET_WS_CONNECTED', payload: true })
      }

      ws.onmessage = (event) => {
        try {
          const data: WebSocketEvent = JSON.parse(event.data)
          setLastEvent(data)
          dispatch({ type: 'ADD_LIVE_EVENT', payload: data })
        } catch {
          // Ignore malformed messages
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        dispatch({ type: 'SET_WS_CONNECTED', payload: false })
        // Auto-reconnect after 3 seconds
        reconnectTimeout.current = setTimeout(connect, 3000)
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
      wsRef.current?.close()
    }
  }, [sessionId, dispatch])

  return { isConnected, lastEvent }
}
