import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Only clean the database in development
  if (process.env.NODE_ENV !== "production") {
  await prisma.attendance.deleteMany()
  await prisma.courseEnrollment.deleteMany()
  await prisma.course.deleteMany()
  await prisma.user.deleteMany()
  }

  // Create test users with proper password hashing
  const password = await hash('password123', 10)

  // Create admin user
  await prisma.user.upsert({
    where: { email: 'admin@unilorin.edu.ng' },
    update: {},
    create: {
      email: 'admin@unilorin.edu.ng',
      name: 'Admin User',
      password,
      role: 'ADMIN',
    },
  })

  // Create lecturer user
  await prisma.user.upsert({
    where: { email: 'lecturer@unilorin.edu.ng' },
    update: {},
    create: {
      email: 'lecturer@unilorin.edu.ng',
      name: 'Test Lecturer',
      password,
      role: 'LECTURER',
      staffId: 'STAFF001',
      faculty: 'Engineering',
      department: 'Computer Engineering',
    },
  })

  // Create student user
  await prisma.user.upsert({
    where: { email: 'student@unilorin.edu.ng' },
    update: {},
    create: {
      email: 'student@unilorin.edu.ng',
      name: 'Test Student',
      password,
      role: 'STUDENT',
      matricNumber: '19/12345',
      faculty: 'Engineering',
      department: 'Computer Engineering',
    },
  })

  // Only create test course/enrollment/attendance if not already present
  const lecturer = await prisma.user.findUnique({ where: { email: 'lecturer@unilorin.edu.ng' } })
  const student = await prisma.user.findUnique({ where: { email: 'student@unilorin.edu.ng' } })

  let course = await prisma.course.findUnique({ where: { code: 'CPT401' } })
  if (!course && lecturer) {
    course = await prisma.course.create({
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
  }

  if (course && student) {
    const existingEnrollment = await prisma.courseEnrollment.findFirst({
      where: { courseId: course.id, studentId: student.id }
    })
    if (!existingEnrollment) {
  await prisma.courseEnrollment.create({
    data: {
      courseId: course.id,
          studentId: student.id,
      status: 'ACTIVE',
    },
  })
    }
    const existingAttendance = await prisma.attendance.findFirst({
      where: { courseId: course.id, studentId: student.id }
    })
    if (!existingAttendance) {
  await prisma.attendance.create({
    data: {
      courseId: course.id,
          studentId: student.id,
      date: new Date(),
      status: 'PRESENT',
    },
  })
    }
  }

  console.log('Database has been seeded with test users (non-destructive in production)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 