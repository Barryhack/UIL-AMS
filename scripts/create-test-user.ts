import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('test123', 10)
  
  const user = await prisma.user.create({
    data: {
      email: 'test@unilorin.edu.ng',
      name: 'Test User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('Created test user:', user)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 