import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Settings } from "lucide-react"

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Manage system notifications and alerts</p>
        </div>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-blue-100 p-2">
                  <Bell className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">System Update</p>
                  <p className="text-sm text-muted-foreground">New system update available</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-yellow-100 p-2">
                  <Bell className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium">Device Alert</p>
                  <p className="text-sm text-muted-foreground">Device LT1-001 needs attention</p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-green-100 p-2">
                  <Bell className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Backup Complete</p>
                  <p className="text-sm text-muted-foreground">System backup completed successfully</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">System Updates</p>
                  <p className="text-sm text-muted-foreground">Get notified about system updates</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Device Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified about device issues</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Backup Notifications</p>
                  <p className="text-sm text-muted-foreground">Get notified about backup status</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 