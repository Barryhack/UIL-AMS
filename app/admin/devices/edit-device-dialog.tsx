"use client"

import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useEffect } from "react"

const peripheralSchema = z.object({
  rfid: z.boolean().default(false),
  biometric: z.boolean().default(false),
  camera: z.boolean().default(false),
})

const deviceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  deviceType: z.string().min(1, "Device type is required"),
  serialNumber: z.string().min(1, "Serial number is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"], {
    required_error: "Status is required",
  }),
  ipAddress: z.string().min(1, "IP address is required"),
  peripherals: peripheralSchema,
})

type DeviceFormValues = z.infer<typeof deviceSchema>

interface EditDeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device: {
    id: string
    name: string
    location: string
    deviceType?: string
    serialNumber: string
    status: string
    ipAddress: string
    macAddress?: string
    deviceId?: string
    peripherals: {
      rfid?: boolean
      biometric?: boolean
      camera?: boolean
    }
  }
  onSubmit: (data: DeviceFormValues) => Promise<void>
}

export function EditDeviceDialog({ open, onOpenChange, device, onSubmit }: EditDeviceDialogProps) {
  // Ensure all peripheral fields are present and default to false if missing
  const safePeripherals = {
    rfid: device.peripherals?.rfid ?? false,
    biometric: device.peripherals?.biometric ?? false,
    camera: device.peripherals?.camera ?? false,
  }
  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: device.name,
      location: device.location,
      deviceType: device.deviceType || "",
      serialNumber: device.serialNumber,
      status: device.status as "ACTIVE" | "INACTIVE" | "MAINTENANCE",
      ipAddress: device.ipAddress,
      peripherals: safePeripherals,
    },
  })

  useEffect(() => {
    form.reset({
      name: device.name,
      location: device.location,
      deviceType: device.deviceType || "",
      serialNumber: device.serialNumber,
      status: device.status as "ACTIVE" | "INACTIVE" | "MAINTENANCE",
      ipAddress: device.ipAddress,
      peripherals: safePeripherals,
    })
  }, [device])

  const handleSubmit = async (data: DeviceFormValues) => {
    await onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-full h-[100vh] max-h-[100vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Device</DialogTitle>
          <DialogDescription>
            Make changes to the microcontroller device and its peripherals.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0 overflow-y-scroll pr-2 space-y-4" style={{ scrollbarGutter: 'stable' }}>
              {device.deviceId && (
                <div>
                  <FormLabel>Device ID</FormLabel>
                  <Input value={device.deviceId} readOnly className="bg-gray-100 cursor-not-allowed" />
                </div>
              )}
              {device.macAddress && (
                <div>
                  <FormLabel>MAC Address</FormLabel>
                  <Input value={device.macAddress} readOnly className="bg-gray-100 cursor-not-allowed" />
                </div>
              )}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter device name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter device location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Hybrid Device" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select device status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ipAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 192.168.1.100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter serial number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Connected Peripherals</h3>
                <FormField
                  control={form.control}
                  name="peripherals.rfid"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>RFID Reader</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="peripherals.biometric"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Biometric Scanner</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="peripherals.camera"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Camera</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="bg-background border-t pt-4 mt-2">
              <DialogFooter>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 