import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import WebSocket from "ws"

const ESP32_WS_URL = process.env.ESP32_WS_URL || "ws://192.168.4.1:81"

async function sendCommandToESP32(command: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(ESP32_WS_URL)

    const timeout = setTimeout(() => {
      ws.close()
      reject(new Error("Connection timeout"))
    }, 10000) // 10 second timeout

    ws.on("open", () => {
      ws.send(JSON.stringify({ command }))
    })

    ws.on("message", (data) => {
      clearTimeout(timeout)
      try {
        const response = JSON.parse(data.toString())
        ws.close()
        resolve(response)
      } catch (error) {
        ws.close()
        reject(new Error("Invalid response from ESP32"))
      }
    })

    ws.on("error", (error) => {
      clearTimeout(timeout)
      ws.close()
      reject(error)
    })
  })
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Only admins can capture RFID
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    // Send command to ESP32 to read RFID card
    const response = await sendCommandToESP32("READ_RFID")

    if (!response.success) {
      throw new Error(response.message || "Failed to read RFID card")
    }

    return NextResponse.json({
      rfidUid: response.rfidUid,
      message: "RFID card scanned successfully",
    })
  } catch (error) {
    console.error("Error scanning RFID card:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to scan RFID card" },
      { status: 500 }
    )
  }
} 