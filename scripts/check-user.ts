import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = '19-30c021@students.unilorin.edu.ng';
  const user = await prisma.user.findUnique({
    where: { email }
  });
  if (user) {
    console.log('User found:', user);
  } else {
    console.log('User not found');
  }
  await prisma.$disconnect();
}
main(); 