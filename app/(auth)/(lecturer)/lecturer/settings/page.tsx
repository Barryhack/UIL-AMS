import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { UserCircle, Mail, Building2, GraduationCap } from "lucide-react"

export default async function LecturerSettings() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  // Get lecturer's profile
  const profile = await prisma.user.findUnique({
    where: {
      id: session.user.id
    }
  })

  if (!profile) {
    return null
  }

  return (
    <div className="flex-1 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Profile Information</h2>
          <p className="text-sm text-muted-foreground">Update your personal information and contact details</p>
          
          <Separator className="my-6" />
          
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="flex gap-2">
                <UserCircle className="h-5 w-5 text-muted-foreground" />
                <Input
                  id="name"
                  defaultValue={profile.name}
                  className="flex-1"
                  disabled
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  defaultValue={profile.email}
                  className="flex-1"
                  disabled
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="staffId">Staff ID</Label>
              <div className="flex gap-2">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                <Input
                  id="staffId"
                  defaultValue={profile.staffId || ''}
                  className="flex-1"
                  disabled
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="department">Department</Label>
              <div className="flex gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <Input
                  id="department"
                  defaultValue={profile.department || ''}
                  className="flex-1"
                  disabled
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold">Account Security</h2>
          <p className="text-sm text-muted-foreground">Update your password and security settings</p>
          
          <Separator className="my-6" />
          
          <div className="space-y-4">
            <Button variant="outline">Change Password</Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold">Preferences</h2>
          <p className="text-sm text-muted-foreground">Customize your teaching and notification preferences</p>
          
          <Separator className="my-6" />
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Preference settings coming soon...</p>
          </div>
        </Card>
      </div>
    </div>
  )
} 