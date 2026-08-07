/**
 * WebSocket Service — Managed real-time WebSocket connection for agent status events.
 *
 * Handles:
 * - Connection lifecycle (connect, disconnect, reconnect)
 * - Event parsing and listener callbacks
 * - Graceful fallback when WebSocket server is unavailable
 */

import type { WebSocketEvent } from '@/types'

export type WebSocketListener = (event: WebSocketEvent) => void
export type ConnectionStatusListener = (connected: boolean) => void

class WebSocketService {
  private socket: WebSocket | null = null
  private listeners: Set<WebSocketListener> = new Set()
  private statusListeners: Set<ConnectionStatusListener> = new Set()
  private isConnected = false
  private currentSessionId: string | null = null
  private reconnectTimer: number | null = null

  public connect(sessionId: string): void {
    if (this.socket && this.currentSessionId === sessionId && this.isConnected) {
      return
    }

    this.disconnect()
    this.currentSessionId = sessionId

    const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'
    const url = `${wsBaseUrl}/api/research/ws/${sessionId}`

    try {
      this.socket = new WebSocket(url)

      this.socket.onopen = () => {
        this.isConnected = true
        this.notifyStatus(true)
        console.log(`WebSocket connected for session: ${sessionId}`)
      }

      this.socket.onmessage = (messageEvent) => {
        try {
          const parsed: WebSocketEvent = JSON.parse(messageEvent.data)
          this.notifyEvent(parsed)
        } catch {
          console.warn('Malformed WebSocket payload:', messageEvent.data)
        }
      }

      this.socket.onerror = () => {
        this.notifyStatus(false)
      }

      this.socket.onclose = () => {
        this.isConnected = false
        this.notifyStatus(false)
      }
    } catch (e) {
      console.warn('WebSocket connection error (operating in offline fallback mode):', e)
      this.notifyStatus(false)
    }
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.socket) {
      this.socket.onopen = null
      this.socket.onmessage = null
      this.socket.onerror = null
      this.socket.onclose = null
      this.socket.close()
      this.socket = null
    }

    this.isConnected = false
    this.currentSessionId = null
    this.notifyStatus(false)
  }

  public subscribe(listener: WebSocketListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  public subscribeStatus(listener: ConnectionStatusListener): () => void {
    this.statusListeners.add(listener)
    listener(this.isConnected)
    return () => this.statusListeners.delete(listener)
  }

  public emitSimulatedEvent(event: WebSocketEvent): void {
    this.notifyEvent(event)
  }

  private notifyEvent(event: WebSocketEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event)
      } catch (err) {
        console.error('Error in WebSocket listener:', err)
      }
    })
  }

  private notifyStatus(connected: boolean): void {
    this.statusListeners.forEach((listener) => {
      try {
        listener(connected)
      } catch (err) {
        console.error('Error in WebSocket status listener:', err)
      }
    })
  }
}

export const webSocketService = new WebSocketService()
export default webSocketService
