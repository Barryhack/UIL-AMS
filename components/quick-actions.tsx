"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  UserPlus,
  FileSpreadsheet,
  Settings,
  Bell,
  Download,
  Printer,
  RefreshCw,
  HardDrive
} from "lucide-react"
import { toast } from "sonner"

const actions = [
  {
    icon: UserPlus,
    label: "New Registration",
    description: "Register new student/staff",
    onClick: () => toast.info("Opening registration form...")
  },
  {
    icon: FileSpreadsheet,
    label: "Export Report",
    description: "Download attendance data",
    onClick: () => toast.info("Preparing report download...")
  },
  {
    icon: Settings,
    label: "Device Setup",
    description: "Configure new device",
    onClick: () => toast.info("Opening device setup wizard...")
  },
  {
    icon: Bell,
    label: "Notifications",
    description: "Manage alerts",
    onClick: () => toast.info("Opening notification settings...")
  },
  {
    icon: Download,
    label: "Backup",
    description: "Backup system data",
    onClick: () => toast.info("Starting backup process...")
  },
  {
    icon: Printer,
    label: "Print Cards",
    description: "Print ID cards",
    onClick: () => toast.info("Opening print dialog...")
  },
  {
    icon: RefreshCw,
    label: "Sync Data",
    description: "Sync with devices",
    onClick: () => toast.info("Starting sync process...")
  },
  {
    icon: HardDrive,
    label: "Storage",
    description: "Manage storage",
    onClick: () => toast.info("Opening storage manager...")
  }
]

export function QuickActions() {
  return (
    <Card className="hover:shadow-lg transition-all">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto flex flex-col items-center justify-center space-y-2 p-4 hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={action.onClick}
              >
                <Icon className="h-6 w-6" />
                <div className="text-xs font-medium text-center">
                  {action.label}
                  <p className="text-[10px] font-normal text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
} 