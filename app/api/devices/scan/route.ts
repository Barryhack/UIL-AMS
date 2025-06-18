import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { deviceId, scanType } = data

    // Find an active device
    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        status: "ACTIVE",
        mode: "ONLINE",
        type: {
          in: scanType === "FINGERPRINT" ? ["FINGERPRINT", "HYBRID"] : ["RFID", "HYBRID"]
        }
      }
    })

    if (!device) {
      return NextResponse.json(
        { error: "No available device found for scanning" },
        { status: 404 }
      )
    }

    // Simulate sending command to device
    console.log(`Sending scan command to device ${device.ipAddress}`)

    // Simulate device response delay (1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))

    // Simulate different scan responses
    let scanData
    if (scanType === "FINGERPRINT") {
      scanData = {
        deviceId: device.id,
        timestamp: new Date().toISOString(),
        scanType,
        data: {
          templateId: `FP_${Date.now()}`,
          quality: 85,
          minutiaeCount: 32,
          template: Buffer.from("simulated-fingerprint-template").toString("base64")
        }
      }
    } else {
      scanData = {
        deviceId: device.id,
        timestamp: new Date().toISOString(),
        scanType,
        data: {
          cardId: `RFID_${Date.now()}`,
          cardType: "MIFARE",
          serialNumber: Buffer.from("simulated-card-serial").toString("hex").toUpperCase()
        }
      }
    }

    return NextResponse.json({
      message: `${scanType} scan completed successfully`,
      ...scanData
    })
  } catch (error) {
    console.error("Error in POST /api/devices/scan:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    )
  }
} 