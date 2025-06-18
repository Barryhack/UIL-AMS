import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import WebSocket from "ws"

// Try both AP and Station mode URLs
async function tryWebSocketConnection(urls: string[]): Promise<WebSocket> {
  for (const url of urls) {
    try {
      const ws = new WebSocket(url)
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close()
          reject(new Error("Connection timeout"))
        }, 5000)

        ws.on("open", () => {
          clearTimeout(timeout)
          resolve(ws)
        })

        ws.on("error", () => {
          clearTimeout(timeout)
          ws.close()
          reject(new Error(`Failed to connect to ${url}`))
        })
      })
      return ws
    } catch (error) {
      console.log(`Failed to connect to ${url}:`, error)
      continue
    }
  }
  throw new Error("Failed to connect to ESP32")
}

async function sendCommandToESP32(command: string): Promise<any> {
  const urls = [
    process.env.ESP32_WS_URL_STATION,
    process.env.ESP32_WS_URL_AP,
  ].filter(Boolean) as string[]

  if (urls.length === 0) {
    throw new Error("No WebSocket URLs configured")
  }

  const ws = await tryWebSocketConnection(urls)

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.close()
      reject(new Error("Command timeout"))
    }, 30000) // 30 second timeout for command execution

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

    ws.send(JSON.stringify({ command }))
  })
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Only admins can capture fingerprints
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    // Send command to ESP32 to capture fingerprint
    const response = await sendCommandToESP32("CAPTURE_FINGERPRINT")

    if (!response.success) {
      throw new Error(response.message || "Failed to capture fingerprint")
    }

    return NextResponse.json({
      fingerprintId: response.fingerprintId,
      message: "Fingerprint captured successfully",
    })
  } catch (error) {
    console.error("Error capturing fingerprint:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to capture fingerprint" },
      { status: 500 }
    )
  }
} 