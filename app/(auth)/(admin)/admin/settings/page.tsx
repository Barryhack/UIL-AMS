import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage system settings and configurations</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="systemName">System Name</Label>
                <Input id="systemName" defaultValue="UNILORIN AMS" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" defaultValue="Africa/Lagos" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Input id="dateFormat" defaultValue="DD/MM/YYYY" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input id="sessionTimeout" type="number" defaultValue="30" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input id="maxLoginAttempts" type="number" defaultValue="5" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                <Input id="passwordExpiry" type="number" defaultValue="90" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="emailServer">Email Server</Label>
                <Input id="emailServer" defaultValue="smtp.example.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="emailPort">Email Port</Label>
                <Input id="emailPort" type="number" defaultValue="587" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="senderEmail">Sender Email</Label>
                <Input id="senderEmail" type="email" defaultValue="noreply@unilorin.edu.ng" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="backupSchedule">Backup Schedule</Label>
                <Input id="backupSchedule" defaultValue="0 0 * * *" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="backupLocation">Backup Location</Label>
                <Input id="backupLocation" defaultValue="/backups" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="retentionDays">Retention Period (days)</Label>
                <Input id="retentionDays" type="number" defaultValue="30" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4">
        <Button variant="outline">Reset</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  )
} 