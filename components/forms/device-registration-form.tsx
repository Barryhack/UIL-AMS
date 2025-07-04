"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Fingerprint } from "lucide-react"

interface DeviceRegistrationFormProps {
  open: boolean
  onClose: () => void
}

export function DeviceRegistrationForm({ open, onClose }: DeviceRegistrationFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    serialNumber: "",
    location: "",
    type: "fingerprint",
    status: "active",
    ipAddress: "",
    macAddress: "",
    deviceId: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Not authenticated")
      }

      const deviceData = {
        name: formData.name,
        serialNumber: formData.serialNumber,
        location: formData.location || "Main Lab",
        status: formData.status.toUpperCase(),
        deviceId: formData.deviceId,
        peripherals: {
          rfid: formData.type === 'rfid' || formData.type === 'hybrid',
          biometric: formData.type === 'fingerprint' || formData.type === 'hybrid',
          camera: false
        }
      }

      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(deviceData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to register device')
      }

      const device = await response.json()
      console.log('Device registered:', device)
      onClose()
    } catch (error) {
      console.error('Error registering device:', error)
      alert(error instanceof Error ? error.message : 'Failed to register device')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Device</DialogTitle>
          <DialogDescription>
            Enter the device details below
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="register-device-name">Device Name</Label>
              <Input
                id="register-device-name"
                placeholder="e.g. Fingerprint Scanner 1"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-device-serial">Serial Number</Label>
              <Input
                id="register-device-serial"
                required
                value={formData.serialNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-device-location">Location</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
              >
                <SelectTrigger id="register-device-location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lt1">Lecture Theatre 1</SelectItem>
                  <SelectItem value="lt2">Lecture Theatre 2</SelectItem>
                  <SelectItem value="lab1">Computer Lab 1</SelectItem>
                  <SelectItem value="lab2">Computer Lab 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-device-type">Device Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="register-device-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fingerprint">Fingerprint Scanner</SelectItem>
                  <SelectItem value="rfid">RFID Reader</SelectItem>
                  <SelectItem value="hybrid">Hybrid Device</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="register-device-ip">IP Address</Label>
                <Input
                  id="register-device-ip"
                  placeholder="e.g. 192.168.1.100"
                  required
                  value={formData.ipAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, ipAddress: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-device-mac">MAC Address</Label>
                <Input
                  id="register-device-mac"
                  placeholder="e.g. 00:1A:2B:3C:4D:5E"
                  required
                  value={formData.macAddress}
                  onChange={(e) => {
                    const mac = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      macAddress: mac,
                      deviceId: mac
                    }));
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-device-id">Device ID</Label>
              <Input
                id="register-device-id"
                placeholder="e.g. 5C:01:3B:4D:F8:08"
                required
                value={formData.deviceId}
                onChange={(e) => setFormData(prev => ({ ...prev, deviceId: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-device-status">Initial Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="register-device-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Device
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 