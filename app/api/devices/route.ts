import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import prisma from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import * as z from "zod"

const peripheralSchema = z.object({
  rfid: z.boolean().default(false),
  biometric: z.boolean().default(false),
  camera: z.boolean().default(false),
})

const deviceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  serialNumber: z.string().min(1, "Serial number is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"], {
    required_error: "Status is required",
  }),
  ipAddress: z.string().min(1, "IP address is required"),
  peripherals: peripheralSchema,
})

// GET /api/devices - Get all devices
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const devices = await prisma.device.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(devices)
  } catch (error) {
    console.error("Error fetching devices:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to fetch devices" },
      { status: 500 }
    )
  }
}

// POST /api/devices - Create a new device
export async function POST(request: Request) {
  try {
    // Try NextAuth session first
    const session = await getServerSession(authOptions)
    let isAdmin = false;

    if (session?.user?.role === "ADMIN") {
      isAdmin = true;
    } else {
      // Try custom token auth
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        // Check if it's our mock admin token
        if (token.startsWith("mock-admin-token-")) {
          isAdmin = true;
        }
      }
    }

    if (!isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = deviceSchema.parse(body)

    // First create or get the location
    const location = await prisma.location.create({
      data: {
        name: validatedData.location,
        type: "ROOM",
        building: "Main Building",
        floor: "1",
        description: `Location for device ${validatedData.name}`
      }
    })

    // Then create the device
    const device = await prisma.device.create({
      data: {
        name: validatedData.name,
        serialNumber: validatedData.serialNumber,
        status: validatedData.status,
        type: validatedData.peripherals.rfid && validatedData.peripherals.biometric ? "HYBRID" :
              validatedData.peripherals.rfid ? "RFID" : "FINGERPRINT",
        mode: "ONLINE",
        locationId: location.id,
      },
    })

    await prisma.auditLog.create({
      data: {
        action: "DEVICE_CREATED",
        details: `Device ${device.name} created`,
        userId: session.user.id,
        entity: "Device",
      },
    });

    return NextResponse.json(device)
  } catch (error) {
    console.error("Error creating device:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid device data", errors: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create device" },
      { status: 500 }
    )
  }
}

// PATCH /api/devices/:id - Update device status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status } = await request.json()
    const { id } = params

    if (!status || !["ACTIVE", "INACTIVE", "MAINTENANCE"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid device status" },
        { status: 400 }
      )
    }

    const device = await prisma.device.update({
      where: { id },
      data: { status },
    })

    // Log device status change
    await prisma.auditLog.create({
      data: {
        action: "DEVICE_STATUS_UPDATED",
        entity: "Device",
        entityId: device.id,
        userId: session.user.id,
        details: `Updated device status to ${status}`,
      },
    })

    return NextResponse.json(device)
  } catch (error) {
    console.error("Error updating device:", error)
    return NextResponse.json(
      { error: "Failed to update device" },
      { status: 500 }
    )
  }
} 