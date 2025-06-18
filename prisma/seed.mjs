import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.attendanceRecord.deleteMany()
  await prisma.session.deleteMany()
  await prisma.courseEnrollment.deleteMany()
  await prisma.course.deleteMany()
  await prisma.biometricData.deleteMany()
  await prisma.rFIDTag.deleteMany()
  await prisma.user.deleteMany()

  // Create users for different roles
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@unilorin.edu.ng',
      name: 'System Administrator',
      password: await bcrypt.hash('admin123', 10),
      role: Role.ADMIN,
    },
  })

  const lecturers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'lecturer1@unilorin.edu.ng',
        name: 'Dr. John Smith',
        password: await bcrypt.hash('lecturer123', 10),
        role: Role.LECTURER,
        department: 'Computer Science',
        faculty: 'Science',
      },
    }),
    prisma.user.create({
      data: {
        email: 'lecturer2@unilorin.edu.ng',
        name: 'Prof. Sarah Johnson',
        password: await bcrypt.hash('lecturer123', 10),
        role: Role.LECTURER,
        department: 'Computer Science',
        faculty: 'Science',
      },
    }),
  ])

  const students = await Promise.all([
    prisma.user.create({
      data: {
        email: 'student1@unilorin.edu.ng',
        name: 'Alice Brown',
        password: await bcrypt.hash('student123', 10),
        role: Role.STUDENT,
        matricNumber: 'CSC/2020/001',
        department: 'Computer Science',
        faculty: 'Science',
      },
    }),
    prisma.user.create({
      data: {
        email: 'student2@unilorin.edu.ng',
        name: 'Bob Wilson',
        password: await bcrypt.hash('student123', 10),
        role: Role.STUDENT,
        matricNumber: 'CSC/2020/002',
        department: 'Computer Science',
        faculty: 'Science',
      },
    }),
    prisma.user.create({
      data: {
        email: 'student3@unilorin.edu.ng',
        name: 'Carol Martinez',
        password: await bcrypt.hash('student123', 10),
        role: Role.STUDENT,
        matricNumber: 'CSC/2020/003',
        department: 'Computer Science',
        faculty: 'Science',
      },
    }),
  ])

  // Create courses
  const courses = await Promise.all([
    prisma.course.create({
      data: {
        code: 'CSC301',
        title: 'Database Management Systems',
        description: 'Introduction to database concepts and systems',
        department: 'Computer Science',
        faculty: 'Science',
      },
    }),
    prisma.course.create({
      data: {
        code: 'CSC302',
        title: 'Data Structures and Algorithms',
        description: 'Advanced data structures and algorithm analysis',
        department: 'Computer Science',
        faculty: 'Science',
      },
    }),
  ])

  // Create course enrollments
  for (const student of students) {
    await Promise.all(
      courses.map((course) =>
        prisma.courseEnrollment.create({
          data: {
            userId: student.id,
            courseId: course.id,
          },
        })
      )
    )
  }

  // Create sessions
  const sessions = await Promise.all(
    courses.map((course, index) =>
      prisma.session.create({
        data: {
          courseId: course.id,
          instructorId: lecturers[index % lecturers.length].id,
          date: new Date(),
          startTime: new Date(new Date().setHours(9, 0, 0, 0)),
          endTime: new Date(new Date().setHours(11, 0, 0, 0)),
          location: `Room ${index + 101}`,
          status: 'SCHEDULED',
        },
      })
    )
  )

  // Create some RFID tags for students
  await Promise.all(
    students.map((student) =>
      prisma.rFIDTag.create({
        data: {
          userId: student.id,
          tagId: `RFID${Math.random().toString(36).substring(7)}`,
        },
      })
    )
  )

  console.log({
    adminUser,
    lecturers,
    students,
    courses,
    sessions,
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 