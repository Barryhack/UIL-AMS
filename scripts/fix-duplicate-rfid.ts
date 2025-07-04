import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface UserWithRfid {
  id: string
  name: string
  email: string
  rfidUid: string
  updatedAt: Date
}

async function fixDuplicateRfidUids() {
  try {
    console.log('Checking for duplicate RFID UIDs...')
    
    // Find all users with RFID UIDs
    const usersWithRfid = await prisma.user.findMany({
      where: {
        rfidUid: { not: null }
      },
      select: {
        id: true,
        name: true,
        email: true,
        rfidUid: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    }) as UserWithRfid[]
    
    console.log(`Found ${usersWithRfid.length} users with RFID UIDs`)
    
    // Group by RFID UID to find duplicates
    const rfidGroups: Record<string, UserWithRfid[]> = {}
    usersWithRfid.forEach(user => {
      if (!rfidGroups[user.rfidUid]) {
        rfidGroups[user.rfidUid] = []
      }
      rfidGroups[user.rfidUid].push(user)
    })
    
    // Find duplicates
    const duplicates = Object.entries(rfidGroups).filter(([rfidUid, users]) => users.length > 1)
    
    if (duplicates.length === 0) {
      console.log('No duplicate RFID UIDs found!')
      return
    }
    
    console.log(`Found ${duplicates.length} duplicate RFID UIDs:`)
    
    // Fix duplicates by keeping only the most recent user
    for (const [rfidUid, users] of duplicates) {
      console.log(`\nRFID UID: ${rfidUid}`)
      console.log('Users with this RFID:')
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - Updated: ${user.updatedAt}`)
      })
      
      // Keep the most recent user (first in the array since we ordered by updatedAt desc)
      const keepUser = users[0]
      const removeUsers = users.slice(1)
      
      console.log(`Keeping: ${keepUser.name} (${keepUser.email})`)
      console.log(`Removing RFID from: ${removeUsers.length} users`)
      
      // Remove RFID UID from other users
      for (const user of removeUsers) {
        await prisma.user.update({
          where: { id: user.id },
          data: { rfidUid: null }
        })
        console.log(`  - Removed RFID from ${user.name}`)
      }
    }
    
    console.log('\nDuplicate RFID UIDs fixed successfully!')
    
  } catch (error) {
    console.error('Error fixing duplicate RFID UIDs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixDuplicateRfidUids() 