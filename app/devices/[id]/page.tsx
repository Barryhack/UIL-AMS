"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/alert"

interface Device {
  id: string
  name: string
  location: string
  type: string
  status: string
  lastSync: string | null
  macAddress: string
  isOnline: boolean
  firmware: string | null
  batteryLevel: number | null
  lastError: string | null
}

interface AttendanceRecord {
  id: string
  userId: string
  user: {
    name: string
    matricNumber: string | null
  }
  sessionId: string
  session: {
    course: {
      code: string
    }
  }
  status: string
  verificationMethod: string
  timestamp: string
}

export default function DeviceDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [device, setDevice] = useState<Device | null>(null)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchDeviceDetails()
  }, [params.id])

  const fetchDeviceDetails = async () => {
    try {
      // Fetch device details
      const deviceResponse = await fetch(`/api/devices/${params.id}`)
      if (!deviceResponse.ok) throw new Error("Failed to fetch device details")
      const deviceData = await deviceResponse.json()
      setDevice(deviceData)

      // Fetch recent attendance records
      const recordsResponse = await fetch(
        `/api/devices/${params.id}/attendance?limit=10`
      )
      if (!recordsResponse.ok)
        throw new Error("Failed to fetch attendance records")
      const recordsData = await recordsResponse.json()
      setRecords(recordsData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!device) return <div>Device not found</div>

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Device Details</h1>
        <Button variant="secondary" onClick={() => router.back()}>
          Back to Devices
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Device Information</h2>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1">{device.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1">{device.location}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1">{device.type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">{device.status}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">MAC Address</dt>
                <dd className="mt-1">{device.macAddress}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Sync</dt>
                <dd className="mt-1">
                  {device.lastSync
                    ? new Date(device.lastSync).toLocaleString()
                    : "Never"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Online Status</dt>
                <dd className="mt-1 flex items-center">
                  <span
                    className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      device.isOnline ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  {device.isOnline ? "Online" : "Offline"}
                </dd>
              </div>
              {device.firmware && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Firmware</dt>
                  <dd className="mt-1">{device.firmware}</dd>
                </div>
              )}
              {device.batteryLevel !== null && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Battery Level
                  </dt>
                  <dd className="mt-1">{device.batteryLevel}%</dd>
                </div>
              )}
              {device.lastError && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Error</dt>
                  <dd className="mt-1 text-red-500">{device.lastError}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Recent Activity</h2>
          </CardHeader>
          <CardContent>
            {records.length > 0 ? (
              <div className="space-y-4">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 border rounded-lg bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {record.user.name}{" "}
                          {record.user.matricNumber && (
                            <span className="text-sm text-gray-500">
                              ({record.user.matricNumber})
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {record.session.course.code} -{" "}
                          {record.verificationMethod}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-medium ${
                            record.status === "PRESENT"
                              ? "text-green-600"
                              : record.status === "LATE"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {record.status}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(record.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 