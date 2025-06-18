import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import prisma from "@/lib/prisma"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      }
    })

    if (!user) {
      redirect("/auth/login")
    }

    return (
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">View and manage your profile information</p>
        </div>

        <Card className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.image || undefined} alt={user.name} />
              <AvatarFallback>{user.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">{user.name}</h2>
              <p className="text-muted-foreground">{user.matricNumber || "No Matric Number"}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 border-t pt-6">
            <div>
              <h3 className="font-medium">Personal Information</h3>
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Email</dt>
                  <dd className="font-medium">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Faculty</dt>
                  <dd className="font-medium">{user.faculty || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Department</dt>
                  <dd className="font-medium">{user.department || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Matric Number</dt>
                  <dd className="font-medium">{user.matricNumber || "Not provided"}</dd>
                </div>
              </dl>
            </div>
          </div>
        </Card>
      </div>
    )
  } catch (error) {
    console.error("[PROFILE_ERROR]", error)
    return (
      <div className="container mx-auto py-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-red-600">Error loading profile</h2>
          <p className="text-muted-foreground">Please try again later</p>
        </Card>
      </div>
    )
  }
} 