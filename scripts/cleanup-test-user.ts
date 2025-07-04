import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupTestUser() {
  try {
    // Delete test users
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'test-rfid'
        }
      }
    })

    console.log(`Deleted ${deletedUsers.count} test users`)
  } catch (error) {
    console.error('Error cleaning up test users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupTestUser() 