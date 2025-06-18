"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Battery, BatteryCharging, Eye, Pencil, Trash2, Wifi, WifiOff } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"
import { Device } from "@prisma/client"

interface Device {
  id: string
  name: string
  location: string
  serialNumber: string
  status: string
  lastSeen: string | null
  battery: string | null
  ipAddress: string
  peripherals: {
    rfid: boolean
    biometric: boolean
    camera: boolean
  }
}

interface DataTableProps {
  onDelete?: (deviceId: string) => void
  onEdit?: (device: Device) => void
  onView?: (deviceId: string) => void
}

export const columns = ({
  onDelete,
  onEdit,
  onView,
}: DataTableProps): ColumnDef<Device>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "peripherals",
    header: "Peripherals",
    cell: ({ row }) => {
      const peripherals = row.getValue("peripherals") as Device["peripherals"]
      const connectedPeripherals = []
      
      if (peripherals.rfid) connectedPeripherals.push("RFID")
      if (peripherals.biometric) connectedPeripherals.push("Biometric")
      if (peripherals.camera) connectedPeripherals.push("Camera")
      
      return (
        <div className="flex flex-wrap gap-1">
          {connectedPeripherals.map((peripheral) => (
            <Badge key={peripheral} variant="outline" className="text-xs">
              {peripheral}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: "location",
    header: "Location",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const variant = {
        ACTIVE: "success",
        INACTIVE: "secondary",
        MAINTENANCE: "warning",
      }[status] || "secondary"

      return (
        <Badge variant={variant as "success" | "warning" | "secondary"} className="capitalize">
          {status.toLowerCase()}
        </Badge>
      )
    },
  },
  {
    accessorKey: "ipAddress",
    header: "Connection",
    cell: ({ row }) => {
      const lastSeen = row.getValue("lastSeen") as string | null
      const isOnline = lastSeen && Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000 // 5 minutes
      
      return (
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-gray-400" />
          )}
          {row.getValue("ipAddress") as string}
        </div>
      )
    },
  },
  {
    accessorKey: "lastSeen",
    header: "Last Seen",
    cell: ({ row }) => {
      const lastSeen = row.getValue("lastSeen") as string
      return lastSeen ? formatRelativeTime(lastSeen) : "Never"
    },
  },
  {
    accessorKey: "battery",
    header: "Battery",
    cell: ({ row }) => {
      const battery = row.getValue("battery") as string | null
      if (!battery) return "N/A"
      
      const percentage = parseInt(battery)
      return (
        <div className="flex items-center gap-2">
          {percentage <= 20 ? (
            <Battery className="h-4 w-4 text-red-500" />
          ) : percentage <= 50 ? (
            <Battery className="h-4 w-4 text-yellow-500" />
          ) : (
            <BatteryCharging className="h-4 w-4 text-green-500" />
          )}
          {battery}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const device = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView?.(device.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(device)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit device
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(device.id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete device
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 