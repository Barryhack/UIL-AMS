"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, Trash } from "lucide-react"

interface DeviceManagementProps {
  devices: {
    id: string
    name: string
    serialNumber: string
    ipAddress?: string | null
    macAddress?: string | null
    location: {
      id: string
      name: string
    }
    type: string
    status: "ACTIVE" | "INACTIVE" | "MAINTENANCE"
    _count: {
      attendanceRecords: number
    }
  }[]
}

export function DeviceManagement({ devices: initialDevices }: DeviceManagementProps) {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [deviceList, setDeviceList] = useState(initialDevices)
  const formRef = useRef<HTMLFormElement>(null)
  const [editingDevice, setEditingDevice] = useState<typeof initialDevices[0] | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const fetchDevices = async () => {
    try {
      let headers: HeadersInit = {
        "Content-Type": "application/json"
      }

      const response = await fetch("/api/admin/devices", {
        headers,
        // Include credentials to send cookies
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Failed to fetch devices")
      }

      const data = await response.json()
      setDeviceList(data)
    } catch (error) {
      console.error("Error fetching devices:", error)
      toast.error("Failed to fetch devices")
    }
  }

  // Only fetch devices when session is authenticated
  useEffect(() => {
    if (status === "authenticated") {
      fetchDevices()
    }
  }, [status])

  const handleDeviceRegistration = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const deviceData = {
        name: formData.get("name"),
        location: formData.get("location"),
        type: formData.get("type"),
        ipAddress: formData.get("ipAddress"),
        macAddress: formData.get("macAddress"),
        serialNumber: formData.get("serialNumber") || `DEV-${Date.now()}`
      }

      const response = await fetch("/api/admin/devices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(deviceData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to register device")
      }

      toast.success("Device registered successfully")
      formRef.current?.reset()
      fetchDevices()
    } catch (error) {
      console.error("Device registration error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to register device")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm("Are you sure you want to delete this device? This action cannot be undone.")) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/devices/${deviceId}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to delete device" }))
        throw new Error(errorData.error || "Failed to delete device")
      }

      const data = await response.json()
      toast.success(data.message || "Device deleted successfully")
      fetchDevices()
    } catch (error) {
      console.error("Device deletion error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete device")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditDevice = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingDevice) return

    setIsLoading(true)
    try {
      const formData = new FormData(event.currentTarget)
      const deviceData = {
        name: formData.get("name"),
        location: formData.get("location"),
        type: formData.get("type"),
        status: formData.get("status"),
        ipAddress: formData.get("ipAddress"),
        macAddress: formData.get("macAddress")
      }

      const response = await fetch(`/api/admin/devices/${editingDevice.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(deviceData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to update device" }))
        throw new Error(errorData.error || "Failed to update device")
      }

      const data = await response.json()
      toast.success("Device updated successfully")
      setShowEditModal(false)
      fetchDevices()
    } catch (error) {
      console.error("Device update error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update device")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeviceSync = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/admin/devices/${deviceId}/sync`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to sync device")

      toast.success("Device synced successfully")
      fetchDevices()
    } catch (error) {
      console.error("Device sync error:", error)
      toast.error("Failed to sync device")
    }
  }

  const handleDeviceTest = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/admin/devices/${deviceId}/test`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to test device")

      toast.success("Device test completed successfully")
    } catch (error) {
      console.error("Device test error:", error)
      toast.error("Failed to test device")
    }
  }

  // If not authenticated, show loading or redirect
  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (status === "unauthenticated") {
    return <div>Please sign in to access device management.</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Register Device</CardTitle>
          <CardDescription>
            Add a new hardware device to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleDeviceRegistration} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Device Name</Label>
                <Input id="name" name="name" placeholder="e.g. ESP32 Scanner 1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="e.g. Main Lab" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Device Type</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FINGERPRINT">Biometric Scanner</SelectItem>
                    <SelectItem value="RFID">RFID Reader</SelectItem>
                    <SelectItem value="HYBRID">Hybrid Device</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ipAddress">IP Address</Label>
                <Input 
                  id="ipAddress" 
                  name="ipAddress" 
                  placeholder="e.g. 192.168.37.229" 
                  defaultValue="192.168.37.229"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="macAddress">MAC Address</Label>
                <Input 
                  id="macAddress" 
                  name="macAddress" 
                  placeholder="e.g. AA:BB:CC:DD:EE:FF" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number (Optional)</Label>
                <Input id="serialNumber" name="serialNumber" placeholder="e.g. ESP32-001" />
              </div>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Registering..." : "Register Device"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Device List</CardTitle>
          <CardDescription>
            View and manage all devices in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>MAC Address</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deviceList.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>{device.name}</TableCell>
                  <TableCell>{device.serialNumber}</TableCell>
                  <TableCell>{device.ipAddress}</TableCell>
                  <TableCell>{device.macAddress}</TableCell>
                  <TableCell>{device.location.name}</TableCell>
                  <TableCell>{device.type}</TableCell>
                  <TableCell>{device.status}</TableCell>
                  <TableCell>{device._count.attendanceRecords}</TableCell>
                  <TableCell className="space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        setEditingDevice(device)
                        setShowEditModal(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="text-destructive"
                      onClick={() => handleDeleteDevice(device.id)}
                      disabled={isLoading}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Device Status</CardTitle>
          <CardDescription>
            Real-time device health and statistics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{initialDevices.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {initialDevices.filter(d => d.status === "ACTIVE").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Inactive Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {initialDevices.filter(d => d.status === "INACTIVE").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {initialDevices.filter(d => d.status === "MAINTENANCE").length}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>
              Update device information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditDevice} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Device Name</Label>
                <Input 
                  id="edit-name" 
                  name="name" 
                  defaultValue={editingDevice?.name}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input 
                  id="edit-location" 
                  name="location" 
                  defaultValue={editingDevice?.location.name}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Device Type</Label>
                <Select name="type" defaultValue={editingDevice?.type}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FINGERPRINT">Biometric Scanner</SelectItem>
                    <SelectItem value="RFID">RFID Reader</SelectItem>
                    <SelectItem value="HYBRID">Hybrid Device</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select name="status" defaultValue={editingDevice?.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ipAddress">IP Address</Label>
                <Input 
                  id="edit-ipAddress" 
                  name="ipAddress" 
                  defaultValue={editingDevice?.ipAddress || ""}
                  placeholder="e.g. 192.168.37.229"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-macAddress">MAC Address</Label>
                <Input 
                  id="edit-macAddress" 
                  name="macAddress" 
                  defaultValue={editingDevice?.macAddress || ""}
                  placeholder="e.g. AA:BB:CC:DD:EE:FF"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-serialNumber">Serial Number</Label>
                <Input 
                  id="edit-serialNumber" 
                  name="serialNumber" 
                  defaultValue={editingDevice?.serialNumber}
                  placeholder="e.g. ESP32-001"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Device"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 