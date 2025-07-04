'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useWebSocket } from '@/hooks/use-websocket'

interface AttendanceUpdate {
  type: 'attendance_update'
  record: any
}

interface WebSocketContextType {
  isConnected: boolean
  error: string | null
  lastAttendanceUpdate: AttendanceUpdate | null
  sendMessage: (message: any) => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [lastAttendanceUpdate, setLastAttendanceUpdate] = useState<AttendanceUpdate | null>(null)

  const { isConnected, error, sendMessage } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'attendance_update') {
        console.log('Real-time attendance update received:', message)
        setLastAttendanceUpdate(message as AttendanceUpdate)
        
        // You can add additional logic here, such as:
        // - Updating local state
        // - Showing notifications
        // - Refreshing data
      }
    },
    onConnect: () => {
      console.log('WebSocket connected - ready for real-time updates')
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected')
    },
    onError: (error) => {
      console.error('WebSocket error:', error)
    }
  })

  const value: WebSocketContextType = {
    isConnected,
    error,
    lastAttendanceUpdate,
    sendMessage
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider')
  }
  return context
} 