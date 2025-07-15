import { PrismaClient } from '@prisma/client'
import pkg from 'bcryptjs'
const { hash } = pkg

const prisma = new PrismaClient()

async function main() {
  // Only clean the database in development
  if (process.env.NODE_ENV !== "production") {
    await prisma.attendance.deleteMany()
    await prisma.courseEnrollment.deleteMany()
    await prisma.course.deleteMany()
    await prisma.user.deleteMany()
  }

  // Create admin user
  const adminPassword = await hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@unilorin.edu.ng' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@unilorin.edu.ng',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log({ admin })

  // Create lecturer user
  const lecturerPassword = await hash('lecturer123', 12)
  const lecturer = await prisma.user.upsert({
    where: { email: 'lecturer@unilorin.edu.ng' },
    update: {},
    create: {
      name: 'Test Lecturer',
      email: 'lecturer@unilorin.edu.ng',
      password: lecturerPassword,
      role: 'LECTURER',
      staffId: 'STAFF001',
      faculty: 'Engineering',
      department: 'Computer Engineering',
    },
  })
  console.log({ lecturer })

  // Create student user
  const studentPassword = await hash('student123', 12)
  const student = await prisma.user.upsert({
    where: { email: 'student@unilorin.edu.ng' },
    update: {},
    create: {
      name: 'Test Student',
      email: 'student@unilorin.edu.ng',
      password: studentPassword,
      role: 'STUDENT',
      matricNumber: '19/12345',
      faculty: 'Engineering',
      department: 'Computer Engineering',
    },
  })
  console.log({ student })

  // Create a course
  const course = await prisma.course.create({
    data: {
      code: 'CPT401',
      title: 'Software Engineering',
      description: 'Introduction to Software Engineering principles and practices',
      units: 3,
      faculty: 'Engineering',
      department: 'Computer Engineering',
      level: '400',
      semester: '1',
      academicYear: '2023/2024',
      maxCapacity: 100,
      lecturer: {
        connect: {
          id: lecturer.id
        }
      }
    },
  })

  // Create course enrollment
  await prisma.courseEnrollment.create({
    data: {
      courseId: course.id,
      studentId: student.id,
      status: 'ACTIVE',
    },
  })

  // Create an attendance record
  await prisma.attendance.create({
    data: {
      courseId: course.id,
      studentId: student.id,
      date: new Date(),
      status: 'PRESENT',
    },
  })

  console.log('Database seeded successfully! (non-destructive in production)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 