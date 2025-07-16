import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

const studentsData = [
  { name: 'Alice Johnson', email: '19-30gc001@students.unilorin.edu.ng', role: 'STUDENT', matricNumber: '19/3GC001' },
  { name: 'Bob Smith', email: '19-30gc002@students.unilorin.edu.ng', role: 'STUDENT', matricNumber: '19/3GC002' },
  { name: 'Charlie Lee', email: '19-30gc003@students.unilorin.edu.ng', role: 'STUDENT', matricNumber: '19/3GC003' },
  { name: 'Diana Prince', email: '19-30gc004@students.unilorin.edu.ng', role: 'STUDENT', matricNumber: '19/3GC004' },
  { name: 'Ethan Brown', email: '19-30gc005@students.unilorin.edu.ng', role: 'STUDENT', matricNumber: '19/3GC005' },
]

const lecturersData = [
  { name: 'John Doe', email: 'john.doe@staff.unilorin.edu.ng', role: 'LECTURER', staffId: 'L2021001' },
  { name: 'Jane Smith', email: 'jane.smith@staff.unilorin.edu.ng', role: 'LECTURER', staffId: 'L2021002' },
  { name: 'Mark Evans', email: 'mark.evans@staff.unilorin.edu.ng', role: 'LECTURER', staffId: 'L2021003' },
]

function randomDateInLastMonth() {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 30)
  const date = new Date(now)
  date.setDate(now.getDate() - daysAgo)
  date.setHours(8 + Math.floor(Math.random() * 6), 0, 0, 0) // 8am-2pm
  return date
}

function randomStatus() {
  const r = Math.random()
  if (r < 0.8) return 'PRESENT'
  if (r < 0.9) return 'LATE'
  return 'ABSENT'
}

function randomFingerprintStatus() {
  const r = Math.random()
  if (r < 0.85) return 'VERIFIED' // 85% success rate
  if (r < 0.95) return 'PRESENT'
  return 'FAILED'
}

function randomVerificationMethod() {
  const r = Math.random()
  if (r < 0.7) return 'FINGERPRINT' // 70% fingerprint, 30% RFID
  return 'RFID'
}

async function main() {
  // 1. Ensure 3 lecturers
  for (const l of lecturersData) {
    const exists = await prisma.user.findUnique({ where: { email: l.email } })
    if (!exists) {
      await prisma.user.create({
        data: {
          ...l,
          password: await hash('password123', 10),
        },
      })
    }
  }
  // 2. Ensure 5 students
  for (const s of studentsData) {
    const exists = await prisma.user.findUnique({ where: { email: s.email } })
    if (!exists) {
      await prisma.user.create({
        data: {
          ...s,
          password: await hash('password123', 10),
        },
      })
    }
  }
  // 3. Fetch all users/courses
  const students = await prisma.user.findMany({ where: { role: 'STUDENT' } })
  const lecturers = await prisma.user.findMany({ where: { role: 'LECTURER' } })
  const courses = await prisma.course.findMany()
  // 4. Assign lecturers to courses (round-robin)
  for (let i = 0; i < courses.length; i++) {
    const course = courses[i]
    const lecturer = lecturers[i % lecturers.length]
    if (course.lecturerId !== lecturer.id) {
      await prisma.course.update({ where: { id: course.id }, data: { lecturerId: lecturer.id } })
    }
  }
  // 5. Enroll all students in all courses
  for (const course of courses) {
    for (const student of students) {
      const exists = await prisma.courseEnrollment.findFirst({ where: { courseId: course.id, studentId: student.id } })
      if (!exists) {
        await prisma.courseEnrollment.create({ data: { courseId: course.id, studentId: student.id, status: 'ENROLLED' } })
      }
    }
  }
  // 6. Create 3 attendance sessions per course (if not already present)
  for (const course of courses) {
    for (let i = 0; i < 3; i++) {
      const sessionDate = randomDateInLastMonth()
      const startTime = new Date(sessionDate)
      const endTime = new Date(sessionDate)
      endTime.setHours(startTime.getHours() + 2)
      // Check if session exists (by course and startTime)
      const sessionExists = await prisma.attendanceSession.findFirst({
        where: {
          courseId: course.id,
          startTime: startTime,
        },
      })
      let session
      if (!sessionExists) {
        session = await prisma.attendanceSession.create({
          data: {
            courseId: course.id,
            date: startTime, // new: required by schema
            startTime,
            endTime,
            type: 'MANUAL',
            status: 'COMPLETED',
            location: 'Demo Room',
          },
        })
      } else {
        session = sessionExists
      }
      // 7. For each session, create attendance records for each student
      for (const student of students) {
        const recordExists = await prisma.attendance.findFirst({
          where: {
            courseId: course.id,
            studentId: student.id,
            date: startTime,
          },
        })
        if (!recordExists) {
          await prisma.attendance.create({
            data: {
              courseId: course.id,
              studentId: student.id,
              date: startTime,
              status: randomStatus(),
            },
          })
        }
      }
    }
  }

  // 8. Create fingerprint attendance records for analytics
  console.log('Creating fingerprint attendance records...')
  const sessions = await prisma.attendanceSession.findMany({
    include: { course: true }
  })
  
  for (const session of sessions) {
    for (const student of students) {
      // Check if attendance record already exists
      const recordExists = await prisma.attendanceRecord.findFirst({
        where: {
          sessionId: session.id,
          studentId: student.id,
        },
      })
      
      if (!recordExists) {
        const verificationMethod = randomVerificationMethod()
        const status = randomFingerprintStatus()
        
        await prisma.attendanceRecord.create({
          data: {
            sessionId: session.id,
            studentId: student.id,
            deviceId: 'demo-device-001', // Demo device ID
            verificationMethod: verificationMethod,
            status: status,
            type: 'IN',
            timestamp: new Date(session.startTime.getTime() + Math.random() * 7200000), // Random time within session
            metadata: JSON.stringify({
              deviceType: 'ESP32',
              location: session.location || 'Demo Room',
              scanQuality: verificationMethod === 'FINGERPRINT' ? Math.floor(Math.random() * 100) + 50 : null,
              confidence: verificationMethod === 'FINGERPRINT' ? Math.random() * 0.3 + 0.7 : null,
            })
          },
        })
      }
    }
  }

  // 9. Create some device status records for error analytics
  console.log('Creating device status records...')
  const deviceStatuses = [
    { status: 'ONLINE', message: 'Device connected successfully' },
    { status: 'ERROR', message: 'Fingerprint sensor malfunction' },
    { status: 'ERROR', message: 'Network connection timeout' },
    { status: 'ONLINE', message: 'Device operating normally' },
    { status: 'ERROR', message: 'SD card write error' },
  ]
  
  for (const deviceStatus of deviceStatuses) {
    await prisma.deviceStatus.create({
      data: {
        deviceId: 'demo-device-001',
        status: deviceStatus.status,
        message: deviceStatus.message,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last week
      },
    })
  }

  // 10. Create some audit log entries for API failure analytics
  console.log('Creating audit log entries...')
  const auditActions = [
    'API_ERROR: Authentication failed',
    'API_ERROR: Database connection timeout',
    'API_ERROR: Invalid request format',
    'API_ERROR: Rate limit exceeded',
    'API_ERROR: Service unavailable',
  ]
  
  for (const action of auditActions) {
    await prisma.auditLog.create({
      data: {
        action: action,
        details: `Demo audit log entry for analytics testing`,
        userId: students[0].id, // Use first student as demo user
        entity: 'System',
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random time in last month
      },
    })
  }

  console.log('Demo data seeded!')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(() => prisma.$disconnect()) 