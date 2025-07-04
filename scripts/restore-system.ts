import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Restoring system after database reset...')
  
  try {
    // Create test users
    const hashedPassword = await bcrypt.hash('123456', 10)
    
    const users = [
      {
        email: '19-30c021@students.unilorin.edu.ng',
        name: 'Test Student',
        password: hashedPassword,
        role: 'STUDENT',
        matricNumber: '19/30C021',
        faculty: 'Engineering',
        department: 'Computer Engineering',
        registrationStatus: 'COMPLETED'
      },
      {
        email: 'lecturer@unilorin.edu.ng',
        name: 'Test Lecturer',
        password: hashedPassword,
        role: 'LECTURER',
        staffId: 'LEC001',
        faculty: 'Engineering',
        department: 'Computer Engineering',
        registrationStatus: 'COMPLETED'
      },
      {
        email: 'admin@unilorin.edu.ng',
        name: 'System Admin',
        password: hashedPassword,
        role: 'ADMIN',
        staffId: 'ADM001',
        faculty: 'IT Services',
        department: 'System Administration',
        registrationStatus: 'COMPLETED'
      }
    ]
    
    console.log('Creating users...')
    for (const userData of users) {
      const user = await prisma.user.create({
        data: userData
      })
      console.log(`Created user: ${user.name} (${user.email})`)
    }
    
    // Create a test course
    console.log('Creating test course...')
    const course = await prisma.course.create({
      data: {
        code: 'CSC101',
        title: 'Introduction to Computer Science',
        description: 'Basic concepts of computer science and programming',
        units: 3,
        level: '100',
        semester: 'First',
        academicYear: '2024/2025',
        faculty: 'Engineering',
        department: 'Computer Engineering',
        venue: 'Room 101',
        lecturerId: (await prisma.user.findUnique({ where: { email: 'lecturer@unilorin.edu.ng' } }))!.id
      }
    })
    console.log(`Created course: ${course.code} - ${course.title}`)
    
    // Enroll student in course
    console.log('Enrolling student in course...')
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        courseId: course.id,
        studentId: (await prisma.user.findUnique({ where: { email: '19-30c021@students.unilorin.edu.ng' } }))!.id,
        status: 'ENROLLED'
      }
    })
    console.log('Student enrolled successfully')
    
    // Create a location
    console.log('Creating location...')
    const location = await prisma.location.create({
      data: {
        name: 'Main Campus',
        type: 'CAMPUS'
      }
    })
    console.log(`Created location: ${location.name}`)
    
    // Create a test device
    console.log('Creating test device...')
    const device = await prisma.device.create({
      data: {
        name: 'Test Device 1',
        serialNumber: 'TEST001',
        macAddress: 'AA:BB:CC:DD:EE:FF',
        status: 'ACTIVE',
        type: 'HYBRID',
        locationId: location.id,
        deviceId: 'AA:BB:CC:DD:EE:FF'
      }
    })
    console.log(`Created device: ${device.name} (${device.serialNumber})`)
    
    console.log('\n✅ System restored successfully!')
    console.log('\nTest accounts:')
    console.log('Student: 19-30c021@students.unilorin.edu.ng / 123456')
    console.log('Lecturer: lecturer@unilorin.edu.ng / 123456')
    console.log('Admin: admin@unilorin.edu.ng / 123456')
    
  } catch (error) {
    console.error('Error restoring system:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 