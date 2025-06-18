'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import type { Course, User, Attendance } from '@prisma/client'

// Dynamically import react-pdf components
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  { ssr: false }
)

const CourseReport = dynamic(
  () => import('./course-report').then(mod => mod.CourseReport),
  { ssr: false }
)

interface PDFGeneratorProps {
  course: Course & {
    lecturer: User
    attendances: (Attendance & {
      student: User
    })[]
    _count: {
      enrollments: number
      attendances: number
    }
  }
  stats: {
    totalRecords: number
    presentCount: number
    attendanceRate: number
  }
}

export function PDFGenerator({ course, stats }: PDFGeneratorProps) {
  const [isClient, setIsClient] = useState(false)

  // Use useEffect to set isClient to true after mount
  useState(() => {
    setIsClient(true)
  })

  if (!isClient) {
    return (
      <Button 
        variant="ghost" 
        className="w-full justify-start" 
        disabled
      >
        <FileText className="mr-2 h-4 w-4" />
        Loading PDF Generator...
      </Button>
    )
  }

  return (
    <PDFDownloadLink
      document={<CourseReport course={course} stats={stats} />}
      fileName={`${course.code}-attendance-report.pdf`}
    >
      {({ loading, error }) => (
        <Button 
          variant="ghost" 
          className="w-full justify-start" 
          disabled={loading}
        >
          <FileText className="mr-2 h-4 w-4" />
          {loading ? 'Generating PDF...' : error ? 'Error' : 'Download as PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  )
} 