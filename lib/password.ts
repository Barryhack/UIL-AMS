import { compare as bcryptCompare, hash as bcryptHash } from "bcrypt"

const BCRYPT_ROUNDS = 10

export async function hash(password: string): Promise<string> {
  return bcryptHash(password, BCRYPT_ROUNDS)
}

export async function compare(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcryptCompare(password, hashedPassword)
  } catch (error) {
    console.error("Password comparison error:", error)
    return false
  }
} 