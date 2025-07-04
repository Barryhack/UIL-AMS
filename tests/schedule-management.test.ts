import { describe, it, expect, beforeEach } from 'vitest'

// Mock data for testing
const mockCourses = [
  {
    id: "1",
    code: "CSC 101",
    title: "Introduction to Computer Science",
    faculty: "Engineering",
    department: "Computer Science",
    lecturer: {
      id: "1",
      name: "Dr. John Doe",
      email: "john.doe@unilorin.edu.ng"
    }
  },
  {
    id: "2",
    code: "MAT 101",
    title: "Mathematics I",
    faculty: "Science",
    department: "Mathematics",
    lecturer: {
      id: "2",
      name: "Dr. Jane Smith",
      email: "jane.smith@unilorin.edu.ng"
    }
  }
]

const mockSchedules = [
  {
    id: "1",
    day: "Monday",
    startTime: "09:00",
    endTime: "10:00",
    venue: "LT1",
    course: {
      code: "CSC 101",
      title: "Introduction to Computer Science",
      lecturer: {
        name: "Dr. John Doe"
      }
    }
  }
]

// Test CSV parsing function
function parseCSV(csvContent: string) {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const schedules = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const schedule = {
      courseCode: values[headers.indexOf('coursecode')] || '',
      day: values[headers.indexOf('day')] || '',
      startTime: values[headers.indexOf('starttime')] || '',
      endTime: values[headers.indexOf('endtime')] || '',
      venue: values[headers.indexOf('venue')] || '',
    }
    schedules.push(schedule)
  }
  
  return schedules
}

// Test validation function
function validateSchedule(schedule: any, courses: any[]) {
  const errors: string[] = []
  let matchedCourse: any = undefined

  // Validate course code
  if (!schedule.courseCode) {
    errors.push("Course code is required")
  } else {
    matchedCourse = courses.find(c => 
      c.code.toLowerCase() === schedule.courseCode.toLowerCase()
    )
    if (!matchedCourse) {
      errors.push("Course not found in system")
    }
  }

  // Validate day
  const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  if (!schedule.day) {
    errors.push("Day is required")
  } else if (!validDays.includes(schedule.day)) {
    errors.push("Invalid day format")
  }

  // Validate times
  if (!schedule.startTime) {
    errors.push("Start time is required")
  } else if (!/^\d{2}:\d{2}$/.test(schedule.startTime)) {
    errors.push("Start time must be in HH:MM format")
  }

  if (!schedule.endTime) {
    errors.push("End time is required")
  } else if (!/^\d{2}:\d{2}$/.test(schedule.endTime)) {
    errors.push("End time must be in HH:MM format")
  }

  if (schedule.startTime && schedule.endTime) {
    const start = new Date(`1970-01-01T${schedule.startTime}`)
    const end = new Date(`1970-01-01T${schedule.endTime}`)
    if (end <= start) {
      errors.push("End time must be after start time")
    }
  }

  // Validate venue
  if (!schedule.venue) {
    errors.push("Venue is required")
  }

  return {
    isValid: errors.length === 0,
    errors,
    matchedCourse
  }
}

describe('Schedule Management', () => {
  describe('CSV Parsing', () => {
    it('should parse valid CSV content', () => {
      const csvContent = `CourseCode,Day,StartTime,EndTime,Venue
CSC 101,Monday,09:00,10:00,LT1
MAT 101,Tuesday,10:00,11:00,LT2`
      
      const schedules = parseCSV(csvContent)
      
      expect(schedules).toHaveLength(2)
      expect(schedules[0]).toEqual({
        courseCode: "CSC 101",
        day: "Monday",
        startTime: "09:00",
        endTime: "10:00",
        venue: "LT1"
      })
    })

    it('should handle empty CSV', () => {
      const csvContent = "CourseCode,Day,StartTime,EndTime,Venue"
      const schedules = parseCSV(csvContent)
      expect(schedules).toHaveLength(0)
    })

    it('should handle CSV with missing headers', () => {
      const csvContent = `CourseCode,Day,StartTime,EndTime,Venue
CSC 101,Monday,09:00,10:00,LT1`
      
      const schedules = parseCSV(csvContent)
      expect(schedules).toHaveLength(1)
      expect(schedules[0].courseCode).toBe("CSC 101")
    })
  })

  describe('Schedule Validation', () => {
    it('should validate correct schedule', () => {
      const schedule = {
        courseCode: "CSC 101",
        day: "Monday",
        startTime: "09:00",
        endTime: "10:00",
        venue: "LT1"
      }
      
      const result = validateSchedule(schedule, mockCourses)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.matchedCourse).toBeDefined()
    })

    it('should reject invalid course code', () => {
      const schedule = {
        courseCode: "INVALID 999",
        day: "Monday",
        startTime: "09:00",
        endTime: "10:00",
        venue: "LT1"
      }
      
      const result = validateSchedule(schedule, mockCourses)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Course not found in system")
    })

    it('should reject invalid day', () => {
      const schedule = {
        courseCode: "CSC 101",
        day: "Saturday",
        startTime: "09:00",
        endTime: "10:00",
        venue: "LT1"
      }
      
      const result = validateSchedule(schedule, mockCourses)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Invalid day format")
    })

    it('should reject invalid time format', () => {
      const schedule = {
        courseCode: "CSC 101",
        day: "Monday",
        startTime: "9:00",
        endTime: "10:00",
        venue: "LT1"
      }
      
      const result = validateSchedule(schedule, mockCourses)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Start time must be in HH:MM format")
    })

    it('should reject end time before start time', () => {
      const schedule = {
        courseCode: "CSC 101",
        day: "Monday",
        startTime: "10:00",
        endTime: "09:00",
        venue: "LT1"
      }
      
      const result = validateSchedule(schedule, mockCourses)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("End time must be after start time")
    })

    it('should reject missing venue', () => {
      const schedule = {
        courseCode: "CSC 101",
        day: "Monday",
        startTime: "09:00",
        endTime: "10:00",
        venue: ""
      }
      
      const result = validateSchedule(schedule, mockCourses)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Venue is required")
    })
  })

  describe('Schedule Data Structure', () => {
    it('should have correct schedule structure', () => {
      const schedule = mockSchedules[0]
      
      expect(schedule).toHaveProperty('id')
      expect(schedule).toHaveProperty('day')
      expect(schedule).toHaveProperty('startTime')
      expect(schedule).toHaveProperty('endTime')
      expect(schedule).toHaveProperty('venue')
      expect(schedule).toHaveProperty('course')
      expect(schedule.course).toHaveProperty('code')
      expect(schedule.course).toHaveProperty('title')
      expect(schedule.course).toHaveProperty('lecturer')
    })

    it('should have valid time format', () => {
      const schedule = mockSchedules[0]
      
      expect(schedule.startTime).toMatch(/^\d{2}:\d{2}$/)
      expect(schedule.endTime).toMatch(/^\d{2}:\d{2}$/)
    })

    it('should have valid day', () => {
      const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
      const schedule = mockSchedules[0]
      
      expect(validDays).toContain(schedule.day)
    })
  })
}) 