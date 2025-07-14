"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";

// Types for attendance and scan events
export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseCode: string;
  sessionId: string;
  timestamp: string;
  method: "FINGERPRINT" | "RFID" | "MANUAL";
  status: "PRESENT" | "ABSENT" | "LATE";
}

export interface ScanEvent {
  scanType: "fingerprint" | "rfid";
  data: string;
  userId?: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  deviceStatusMap: Record<string, string>; // deviceId -> status
  getDeviceStatus: (deviceId: string) => string | undefined;
  lastAttendanceUpdate: AttendanceRecord | null;
  lastScanEvent: ScanEvent | null;
  sendMessage: (msg: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [deviceStatusMap, setDeviceStatusMap] = useState<Record<string, string>>({});
  const [lastAttendanceUpdate, setLastAttendanceUpdate] = useState<AttendanceRecord | null>(null);
  const [lastScanEvent, setLastScanEvent] = useState<ScanEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelay = 5000;

  // Connect and handle WebSocket events
  const connect = () => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || "wss://unilorin-ams-ws-server.onrender.com/api/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WebSocket] OPEN');
      setIsConnected(true);
      ws.send(JSON.stringify({ type: "hello", clientType: "web-client" }));
    };

    ws.onmessage = (event) => {
      console.log('[WebSocket] MESSAGE', event.data);
      try {
        const message = JSON.parse(event.data);
        if (message.type === "attendance_update") {
          setLastAttendanceUpdate(message.record);
        } else if (message.type === "scan") {
          setLastScanEvent({
            scanType: message.scanType,
            data: message.data,
            userId: message.userId,
          });
        } else if (message.type === "device_status") {
          // Update device status map for multi-device support
          setDeviceStatusMap(prev => ({
            ...prev,
            [message.deviceId]: message.status
          }));
          // Optionally, set global isConnected if any device is online
          setIsConnected(Object.values({
            ...deviceStatusMap,
            [message.deviceId]: message.status
          }).includes('online'));
        }
      } catch (err) {
        // Ignore parse errors
      }
    };

    ws.onclose = (event) => {
      console.log('[WebSocket] CLOSE', event.code, event.reason);
      setIsConnected(false);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay);
    };

    ws.onerror = (event) => {
      console.log('[WebSocket] ERROR', event);
      // Error is handled by onclose
    };
  };

  // Cleanup on unmount
  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const sendMessage = (msg: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  // Helper to get a device's status
  const getDeviceStatus = (deviceId: string) => deviceStatusMap[deviceId];

  return (
    <WebSocketContext.Provider value={{ isConnected, deviceStatusMap, getDeviceStatus, lastAttendanceUpdate, lastScanEvent, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useWebSocketContext must be used within a WebSocketProvider");
  return ctx;
} 