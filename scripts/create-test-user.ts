import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// CHANGE THESE VALUES TO THE USER YOU WANT TO RESET
const email = 'test-rfid-2@students.unilorin.edu.ng'
const name = 'Test RFID User 2'
const matricNumber = 'TEST/2024/002'
const role = 'STUDENT'
const rfidUid = 'B3D528E3' // This should already exist and cause a conflict

async function main() {
  const hashedPassword = await bcrypt.hash(matricNumber, 10)

  try {
    // Try to create a user with an existing RFID UID
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        matricNumber,
        rfidUid, // This should cause a unique constraint violation
      },
    })
    console.log('Created user:', user)
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('rfidUid')) {
      console.log('✅ RFID UID unique constraint working correctly!')
      console.log('Error:', error.message)
    } else {
      console.log('❌ Unexpected error:', error)
      console.log('Error code:', error.code)
      console.log('Error meta:', error.meta)
    }
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 