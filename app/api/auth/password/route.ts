import { NextResponse } from "next/server"
import { compare as bcryptCompare, hash as bcryptHash } from "bcrypt"
import { pbkdf2Sync, randomBytes } from "crypto"

const ITERATIONS = 1000
const KEYLEN = 64
const SALT_LENGTH = 16
const DIGEST = "sha512"
const BCRYPT_ROUNDS = 10

export async function POST(req: Request) {
  try {
    const { password, hashedPassword, action } = await req.json()

    if (action === "hash") {
      const hashed = await bcryptHash(password, BCRYPT_ROUNDS)
      return NextResponse.json({ hash: hashed })
    }

    if (action === "compare") {
      let isValid = false

      // Handle PBKDF2 format
      if (hashedPassword.startsWith("pbkdf2:")) {
        const [_, salt, storedHash] = hashedPassword.split(":")
        const hash = pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString("hex")
        isValid = storedHash === hash
      } else {
        // If not PBKDF2, assume it's bcrypt
        isValid = await bcryptCompare(password, hashedPassword)
      }

      return NextResponse.json({ isValid })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Password operation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const runtime = "nodejs" 