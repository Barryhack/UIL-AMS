"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { HardwareScanner } from "@/components/forms/HardwareScanner"
import { faculties } from "@/lib/constants/faculties"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, Trash, Fingerprint, CreditCard } from "lucide-react"

interface UserManagementProps {
  users: {
    id: string
    name: string | null
    email: string
    role: string
    matricNumber: string | null
    department: string | null
    createdAt: Date
  }[]
}

export function UserManagement({ users }: UserManagementProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [scanMode, setScanMode] = useState<'SCAN' | 'ENROLL' | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [biometricData, setBiometricData] = useState<string | null>(null)
  const [rfidData, setRfidData] = useState<string | null>(null)
  const [selectedFaculty, setSelectedFaculty] = useState<string>("")
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])

  const handleFacultyChange = (facultyId: string) => {
    setSelectedFaculty(facultyId)
    setSelectedDepartments([])
  }

  const handleStudentRegistration = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    setIsLoading(true)

    try {
      const formData = new FormData(form)
      const email = formData.get("email") as string
      const matricNumber = formData.get("matricNumber") as string

      // Validate student email format
      if (!email.endsWith("@student.unilorin.edu.ng")) {
        throw new Error("Email must be in format: username@student.unilorin.edu.ng")
      }

      // Validate biometric and RFID data
      if (!biometricData || !rfidData) {
        throw new Error("Both fingerprint and RFID card scans are required")
      }

      const studentData = {
        name: formData.get("name"),
        email,
        password: matricNumber, // Use matric number as default password
        matricNumber,
        faculty: formData.get("faculty"),
        department: formData.get("department"),
        level: formData.get("level"),
        role: "STUDENT",
        biometricData,
        rfidData
      }

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to register student")
      }

      toast.success("Student registered successfully. Default password is their matric number.")
      form.reset()
      setBiometricData('')
      setRfidData('')
    } catch (error) {
      console.error("Registration error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to register student")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLecturerRegistration = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    setIsLoading(true)

    try {
      const formData = new FormData(form)
      const email = formData.get("email") as string
      const password = formData.get("password") as string
      const confirmPassword = formData.get("confirmPassword") as string

      // Validate lecturer email format
      if (!email.endsWith("@staff.unilorin.edu.ng")) {
        throw new Error("Email must be in format: username@staff.unilorin.edu.ng")
      }

      // Validate password
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters long")
      }

      // Validate password confirmation
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match")
      }

      // Validate biometric and RFID data
      if (!biometricData || !rfidData) {
        throw new Error("Both fingerprint and RFID card scans are required")
      }

      const lecturerData = {
        name: formData.get("name"),
        email,
        password,
        confirmPassword,
        staffId: formData.get("staffId"),
        faculty: formData.get("faculty"),
        department: formData.get("department"),
        role: "LECTURER",
        biometricData,
        rfidData
      }

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lecturerData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to register lecturer")
      }

      toast.success("Lecturer registered successfully")
      form.reset()
      setBiometricData('')
      setRfidData('')
    } catch (error) {
      console.error("Registration error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to register lecturer")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFingerprintScanned = (data: string) => {
    setBiometricData(data)
    setScanMode(null)
    toast.success("Fingerprint scan completed")
  }

  const handleRFIDScanned = (data: string) => {
    setRfidData(data)
    setScanMode(null)
    toast.success("RFID card scanned successfully")
  }

  const handleFingerprintEnrolled = (data: string) => {
    setBiometricData(data)
    setScanMode(null)
    toast.success("Fingerprint enrolled successfully")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Registration</CardTitle>
          <CardDescription>Register new students and lecturers</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="students" className="space-y-4">
            <TabsList>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="lecturers">Lecturers</TabsTrigger>
            </TabsList>

            <TabsContent value="students">
              <form onSubmit={handleStudentRegistration} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      placeholder="username@student.unilorin.edu.ng"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="matricNumber">Matric Number</Label>
                    <Input id="matricNumber" name="matricNumber" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">Level</Label>
                    <Select name="level" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">100 Level</SelectItem>
                        <SelectItem value="200">200 Level</SelectItem>
                        <SelectItem value="300">300 Level</SelectItem>
                        <SelectItem value="400">400 Level</SelectItem>
                        <SelectItem value="500">500 Level</SelectItem>
                        <SelectItem value="600">600 Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="faculty">Faculty</Label>
                    <Select 
                      name="faculty" 
                      value={selectedFaculty}
                      onValueChange={handleFacultyChange}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculties.map((faculty) => (
                          <SelectItem 
                            key={faculty.id} 
                            value={faculty.id}
                          >
                            {faculty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select 
                      name="department" 
                      required
                      disabled={!selectedFaculty}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedFaculty ? "Select department" : "Select faculty first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedFaculty && faculties
                          .find(f => f.id === selectedFaculty)
                          ?.departments.map((dept) => (
                            <SelectItem 
                              key={dept} 
                              value={dept}
                            >
                              {dept}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant="outline"
                    onClick={() => setScanMode('ENROLL')}
                    className="w-full"
                    >
                    <Fingerprint className="mr-2 h-4 w-4" />
                    {biometricData ? "Rescan Fingerprint" : "Scan Fingerprint"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                    onClick={() => setScanMode('SCAN')}
                    className="w-full"
                    >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {rfidData ? "Rescan RFID Card" : "Scan RFID Card"}
                    </Button>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  Register Student
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="lecturers">
              <form onSubmit={handleLecturerRegistration} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      placeholder="username@staff.unilorin.edu.ng"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="staffId">Staff ID</Label>
                    <Input id="staffId" name="staffId" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      name="password" 
                      type="password" 
                      required 
                      minLength={8}
                    />
                  </div>
                </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input 
                      id="confirmPassword" 
                      name="confirmPassword" 
                      type="password" 
                      required 
                      minLength={8}
                    />
                  </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="faculty">Faculty</Label>
                    <Select 
                      name="faculty" 
                      value={selectedFaculty}
                      onValueChange={handleFacultyChange}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculties.map((faculty) => (
                          <SelectItem 
                            key={faculty.id} 
                            value={faculty.id}
                          >
                            {faculty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select 
                      name="department" 
                      required
                      disabled={!selectedFaculty}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedFaculty ? "Select department" : "Select faculty first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedFaculty && faculties
                          .find(f => f.id === selectedFaculty)
                          ?.departments.map((dept) => (
                            <SelectItem 
                              key={dept} 
                              value={dept}
                            >
                              {dept}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setScanMode('ENROLL')}
                    className="w-full"
                  >
                    <Fingerprint className="mr-2 h-4 w-4" />
                    {biometricData ? "Rescan Fingerprint" : "Scan Fingerprint"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setScanMode('SCAN')}
                    className="w-full"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {rfidData ? "Rescan RFID Card" : "Scan RFID Card"}
                  </Button>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  Register Lecturer
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>View and manage system users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Matric Number</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.department || "-"}</TableCell>
                    <TableCell>{user.matricNumber || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {scanMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-lg w-96 relative z-[10000]">
            <h2 className="text-lg font-semibold mb-4">
              {scanMode === 'SCAN' ? 'Scan RFID Card' : 'Enroll Fingerprint'}
            </h2>
            <HardwareScanner
              mode={scanMode}
              userId={currentUserId}
              onRFIDScanned={handleRFIDScanned}
              onFingerprintScanned={handleFingerprintScanned}
              onFingerprintEnrolled={handleFingerprintEnrolled}
            />
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => setScanMode(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 