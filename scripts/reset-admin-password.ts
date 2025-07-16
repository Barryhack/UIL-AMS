import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@unilorin.edu.ng';
  const newPassword = 'admin123';
  const hashed = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.update({
    where: { email },
    data: { password: hashed }
  });

  console.log('Admin password reset:', user.email);
  await prisma.$disconnect();
}

main(); 