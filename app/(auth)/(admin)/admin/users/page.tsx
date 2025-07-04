import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { UserManagement } from "@/components/admin/user-management"

export default async function UsersPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc"
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      matricNumber: true,
      department: true,
      createdAt: true,
      fingerprintId: true,
      rfidUid: true,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage system users and their roles</p>
      </div>

      <UserManagement users={users} />
    </div>
  )
} 