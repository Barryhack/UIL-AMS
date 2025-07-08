import { useEffect, useRef, useState, useCallback } from 'react'

interface WebSocketMessage {
  type: string
  [key: string]: any
}

interface UseWebSocketOptions {
  url?: string
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
  shouldReconnect?: boolean // New option
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'wss://unilorin-ams-ws-server.onrender.com/api/ws',
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    shouldReconnect = true // Default to true
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [connecting, setConnecting] = useState(false) // New state
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isUnmountedRef = useRef(false)

  // Prevent overlapping connect/reconnect
  const isConnectingRef = useRef(false)

  const connect = useCallback(() => {
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connecting or open, skipping connect()')
      return
    }
    isConnectingRef.current = true
    setConnecting(true)
    setError(null)
    try {
      const ws = new WebSocket(url)
      wsRef.current = ws
      console.log('[WebSocket] Attempting connection to', url)

      ws.onopen = () => {
        console.log('[WebSocket] Connected')
        setIsConnected(true)
        setConnecting(false)
        setError(null)
        reconnectAttemptsRef.current = 0
        isConnectingRef.current = false
        onConnect?.()
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log('[WebSocket] Message received:', message)
          onMessage?.(message)
        } catch (err) {
          console.error('[WebSocket] Error parsing message:', err)
        }
      }

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason)
        setIsConnected(false)
        setConnecting(false)
        isConnectingRef.current = false
        onDisconnect?.()

        // Attempt to reconnect if not a normal closure and allowed
        if (
          shouldReconnect &&
          event.code !== 1000 &&
          reconnectAttemptsRef.current < maxReconnectAttempts &&
          !isUnmountedRef.current
        ) {
          reconnectAttemptsRef.current++
          const delay = reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1)
          console.log(
            `[WebSocket] Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts}) in ${delay}ms...`
          )
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        }
      }

      ws.onerror = (event) => {
        console.error('[WebSocket] Error:', event)
        setError('WebSocket connection error')
        onError?.(event)
      }
    } catch (err) {
      console.error('[WebSocket] Error creating connection:', err)
      setError('Failed to create WebSocket connection')
      setConnecting(false)
      isConnectingRef.current = false
    }
  }, [url, onMessage, onConnect, onDisconnect, onError, reconnectInterval, maxReconnectAttempts, shouldReconnect])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.onopen = null
      wsRef.current.onmessage = null
      wsRef.current.onclose = null
      wsRef.current.onerror = null
      wsRef.current.close(1000, 'Client disconnect')
      wsRef.current = null
    }
    setIsConnected(false)
    setConnecting(false)
    reconnectAttemptsRef.current = 0
    isConnectingRef.current = false
  }, [])

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('[WebSocket] Not connected, cannot send message')
    }
  }, [])

  useEffect(() => {
    isUnmountedRef.current = false
    connect()
    return () => {
      isUnmountedRef.current = true
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    connecting,
    error,
    sendMessage,
    connect,
    disconnect
  }
} 