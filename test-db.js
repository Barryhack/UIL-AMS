import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test user count
    const userCount = await prisma.user.count();
    console.log(`✅ User count: ${userCount}`);
    
    // Test user query (similar to the API)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        staffId: true,
        faculty: true,
        department: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    console.log(`✅ Found ${users.length} users`);
    
    // Test specific user query
    if (users.length > 0) {
      const firstUser = await prisma.user.findUnique({
        where: { id: users[0].id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
      console.log('✅ User query successful:', firstUser?.name);
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase(); 