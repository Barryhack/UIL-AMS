import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testEnrollmentAPI() {
  try {
    // Find a user with an existing RFID UID
    const userWithRfid = await prisma.user.findFirst({
      where: {
        rfidUid: { not: null }
      },
      select: {
        id: true,
        name: true,
        email: true,
        rfidUid: true
      }
    })

    if (!userWithRfid) {
      console.log('No user with RFID UID found in database')
      return
    }

    console.log('Found user with RFID UID:', userWithRfid)

    // Find another user without RFID UID
    const userWithoutRfid = await prisma.user.findFirst({
      where: {
        rfidUid: null
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    if (!userWithoutRfid) {
      console.log('No user without RFID UID found in database')
      return
    }

    console.log('Found user without RFID UID:', userWithoutRfid)

    // Test enrollment API with duplicate RFID UID
    const response = await fetch('http://localhost:3000/api/biometrics/enroll', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userWithoutRfid.id,
        rfidData: userWithRfid.rfidUid // Use the same RFID UID
      })
    })

    const result = await response.json()
    
    if (response.status === 409) {
      console.log('✅ Enrollment API correctly rejected duplicate RFID UID!')
      console.log('Response:', result)
    } else {
      console.log('❌ Enrollment API should have rejected duplicate RFID UID')
      console.log('Status:', response.status)
      console.log('Response:', result)
    }

  } catch (error) {
    console.error('Error testing enrollment API:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testEnrollmentAPI() 