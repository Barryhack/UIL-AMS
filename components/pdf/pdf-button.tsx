'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

interface PDFButtonProps {
  courseId: string
  courseName: string
}

export function PDFButton({ courseId, courseName }: PDFButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDownload = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/reports/course/${courseId}?format=pdf`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Create a blob from the PDF Stream
      const blob = await response.blob()
      // Create a link element
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = `${courseName}-attendance-report.pdf`
      // Append to html link element page
      document.body.appendChild(link)
      // Start download
      link.click()
      // Clean up and remove the link
      link.parentNode?.removeChild(link)
    } catch (error) {
      console.error('Error downloading PDF:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant="ghost" 
      className="w-full justify-start" 
      onClick={handleDownload}
      disabled={isLoading}
    >
      <FileText className="mr-2 h-4 w-4" />
      {isLoading ? 'Generating PDF...' : 'Download as PDF'}
    </Button>
  )
} 