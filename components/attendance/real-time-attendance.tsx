"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useWebSocketContext } from "@/lib/websocket-context"
import { toast } from "sonner"
import { Users, Clock, CheckCircle, XCircle, Wifi, WifiOff } from "lucide-react"

interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  courseId: string
  courseCode: string
  sessionId: string
  timestamp: string
  method: 'FINGERPRINT' | 'RFID' | 'MANUAL'
  status: 'PRESENT' | 'ABSENT' | 'LATE'
}

interface RealTimeAttendanceProps {
  sessionId?: string
  courseId?: string
  onAttendanceUpdate?: (record: AttendanceRecord) => void
}

export function RealTimeAttendance({ sessionId, courseId, onAttendanceUpdate }: RealTimeAttendanceProps) {
  const [recentAttendances, setRecentAttendances] = useState<AttendanceRecord[]>([])
  const [totalAttendances, setTotalAttendances] = useState(0)
  const { isConnected, lastAttendanceUpdate } = useWebSocketContext()

  // Handle real-time attendance updates
  useEffect(() => {
    if (lastAttendanceUpdate) {
      const record = lastAttendanceUpdate as AttendanceRecord
      // Only process records for the current session/course if specified
      if ((sessionId && record.sessionId === sessionId) || 
          (courseId && record.courseId === courseId) ||
          (!sessionId && !courseId)) {
        setRecentAttendances(prev => [record, ...prev.slice(0, 9)]) // Keep last 10
        setTotalAttendances(prev => prev + 1)
        onAttendanceUpdate?.(record)
        const methodIcon = record.method === 'FINGERPRINT' ? '👆' : 
                          record.method === 'RFID' ? '📱' : '✍️'
        const statusIcon = record.status === 'PRESENT' ? '✅' : 
                          record.status === 'LATE' ? '⏰' : '❌'
        toast.success(`${methodIcon} ${record.studentName} marked ${record.status.toLowerCase()}`, {
          description: `${statusIcon} ${record.courseCode} • ${new Date(record.timestamp).toLocaleTimeString()}`
        })
      }
    }
  }, [lastAttendanceUpdate, sessionId, courseId, onAttendanceUpdate])

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'FINGERPRINT':
        return '👆'
      case 'RFID':
        return '📱'
      case 'MANUAL':
        return '✍️'
      default:
        return '❓'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge variant="success" className="bg-green-500">Present</Badge>
      case 'LATE':
        return <Badge variant="warning" className="bg-yellow-500">Late</Badge>
      case 'ABSENT':
        return <Badge variant="danger">Absent</Badge>
      default:
        return <Badge variant="primary">Unknown</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Real-Time Attendance
            </CardTitle>
            <CardDescription>
              Live updates from hardware devices
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">Offline</span>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Count */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-semibold">Total Attendances</span>
            </div>
            <span className="text-2xl font-bold">{totalAttendances}</span>
          </div>

          {/* Recent Attendances */}
          <div>
            <h4 className="font-medium mb-3">Recent Records</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentAttendances.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No attendance records yet</p>
                  <p className="text-sm">Records will appear here in real-time</p>
                </div>
              ) : (
                recentAttendances.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getMethodIcon(record.method)}</span>
                      <div>
                        <p className="font-medium">{record.studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.courseCode} • {new Date(record.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(record.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Connection Status */}
          {!isConnected && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Real-time updates disconnected</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Attendance records will still be saved but won't appear in real-time
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 