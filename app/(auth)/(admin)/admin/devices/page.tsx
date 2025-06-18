import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DeviceManagement } from "@/components/admin/device-management"
import prisma from "@/lib/prisma"
import { Device, Location } from "@prisma/client"

interface DeviceWithRelations extends Device {
  location: Pick<Location, "id" | "name">
  _count: {
    attendanceRecords: number
  }
}

export default async function DevicesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/auth/signin")
  }

  // Fetch initial devices data
  const devices = await prisma.device.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      location: {
        select: {
          id: true,
          name: true
        }
      },
      _count: {
        select: {
          attendanceRecords: true
        }
      }
    }
  }) as DeviceWithRelations[]

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Device Management</h1>
        <p className="text-muted-foreground">
          Register and manage attendance devices.
        </p>
      </div>
      
      <DeviceManagement devices={devices} />
    </div>
  )
} 