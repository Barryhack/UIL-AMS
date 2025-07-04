"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import dynamic from "next/dynamic"
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
import { EditUserModal } from "@/components/admin/edit-user-modal"

// Dynamically import HardwareScanner to prevent SSR issues
const HardwareScanner = dynamic(() => import("@/components/forms/HardwareScanner").then(mod => ({ default: mod.HardwareScanner })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-4">Loading scanner...</div>
})

interface UserManagementProps {
  users: {
    id: string
    name: string | null
    email: string
    role: string
    matricNumber: string | null
    department: string | null
    createdAt: Date
    fingerprintId: string | null
    rfidUid: string | null
  }[]
}

export function UserManagement({ users }: UserManagementProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [scanMode, setScanMode] = useState<'SCAN' | 'ENROLL' | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [biometricData, setBiometricData] = useState<string | null>(null)
  const [rfidData, setRfidData] = useState<string | null>(null)
  const [selectedFaculty, setSelectedFaculty] = useState<string>("")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const [selectedLevel, setSelectedLevel] = useState<string>("")
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
  const [studentStep, setStudentStep] = useState(1); // 1: basic info, 2: scan
  const [createdStudentId, setCreatedStudentId] = useState<string | null>(null);
  const [devices, setDevices] = useState<any[]>([])
  const [devicesLoading, setDevicesLoading] = useState(false)
  const [editUser, setEditUser] = useState<any | null>(null);

  useEffect(() => {
    setDevicesLoading(true)
    fetch("/api/admin/devices", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setDevices(Array.isArray(data) ? data : [])
        setDevicesLoading(false)
      })
      .catch(() => setDevicesLoading(false))
  }, [])

  const handleFacultyChange = (facultyId: string) => {
    setSelectedFaculty(facultyId)
    setSelectedDepartment("")
  }

  const handleStudentBasicInfo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setIsLoading(true);
    try {
      const formData = new FormData(form);
      const email = formData.get("email") as string;
      const matricNumber = formData.get("matricNumber") as string;
      if (!email.endsWith("@students.unilorin.edu.ng")) {
        throw new Error("Email must be in format: username@students.unilorin.edu.ng");
      }
      if (!selectedDeviceId) {
        throw new Error("Device assignment is required");
      }
      if (!selectedDepartment) {
        throw new Error("Department is required");
      }
      if (!selectedLevel) {
        throw new Error("Level is required");
      }
      const studentData = {
        name: formData.get("name"),
        email,
        password: matricNumber,
        confirmPassword: matricNumber,
        matricNumber,
        faculty: selectedFaculty,
        department: selectedDepartment,
        level: selectedLevel,
        role: "STUDENT",
        deviceId: selectedDeviceId,
      };
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to register student");
      }
      toast.success("Basic info saved. Proceed to scan fingerprint and RFID.");
      setCreatedStudentId(data.user.id);
      setStudentStep(2);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to register student");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLecturerRegistration = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    setIsLoading(true)

    try {
      const formData = new FormData(form)
      const email = formData.get("email") as string
      const password = formData.get("password") as string
      const confirmPassword = formData.get("confirmPassword") as string

      if (!email.endsWith("@staff.unilorin.edu.ng")) {
        throw new Error("Email must be in format: username@staff.unilorin.edu.ng")
      }
      if (!selectedDeviceId) {
        throw new Error("Device assignment is required")
      }
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters long")
      }
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match")
      }
      // Only require both scans for students
      // For lecturers and admins, allow registration without both
      if (formData.get("role") === "STUDENT" && (!biometricData || !rfidData)) {
        throw new Error("Both fingerprint and RFID card scans are required for students")
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
        rfidData,
        deviceId: selectedDeviceId,
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

  const handleBiometricUpdate = async (updateData: { fingerprintId?: string; rfidUid?: string }) => {
    if (!createdStudentId) {
      toast.error("No student selected for biometric update.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${createdStudentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update biometric data.');
      }
      toast.success('Biometric data saved successfully!');
    } catch (error) {
      console.error('Biometric update error:', error);
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFingerprintScanned = (data: string) => {
    setBiometricData(data)
    setScanMode(null)
    toast.success("Fingerprint scan completed")
    handleBiometricUpdate({ fingerprintId: data })
  }

  const handleRFIDScanned = (data: string) => {
    setRfidData(data)
    setScanMode(null)
    toast.success("RFID card scanned successfully")
    handleBiometricUpdate({ rfidUid: data })
  }

  const handleFingerprintEnrolled = (data: string) => {
    setBiometricData(data)
    setScanMode(null)
    toast.success("Fingerprint enrolled successfully")
    handleBiometricUpdate({ fingerprintId: data })
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user");
      }
      toast.success(data.message || "User deleted successfully");
      window.location.reload();
    } catch (error) {
      console.error("User deletion error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setIsLoading(false);
    }
  };

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
              {studentStep === 1 && (
                <form onSubmit={handleStudentBasicInfo} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="student-name">Full Name</Label>
                      <Input 
                        id="student-name" 
                        name="name" 
                        autoComplete="name"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-email">Email</Label>
                      <Input 
                        id="student-email" 
                        name="email" 
                        type="email" 
                        autoComplete="email"
                        placeholder="username@student.unilorin.edu.ng"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="student-matricNumber">Matric Number</Label>
                      <Input 
                        id="student-matricNumber" 
                        name="matricNumber" 
                        autoComplete="off"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-level">Level</Label>
                      <Select 
                        name="level" 
                        value={selectedLevel}
                        onValueChange={setSelectedLevel}
                        required
                      >
                        <SelectTrigger id="student-level">
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
                      <Label htmlFor="student-faculty">Faculty</Label>
                      <Select 
                        name="faculty" 
                        value={selectedFaculty}
                        onValueChange={handleFacultyChange}
                        required
                      >
                        <SelectTrigger id="student-faculty">
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
                      <Label htmlFor="student-department">Department</Label>
                      <Select 
                        name="department" 
                        value={selectedDepartment}
                        onValueChange={setSelectedDepartment}
                        required
                        disabled={!selectedFaculty}
                      >
                        <SelectTrigger id="student-department">
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
                    <div className="space-y-2">
                      <Label htmlFor="student-register-device">Assign Device</Label>
                      <Select
                        value={selectedDeviceId}
                        onValueChange={setSelectedDeviceId}
                        disabled={devicesLoading || devices.length === 0}
                      >
                        <SelectTrigger id="student-register-device">
                          <SelectValue placeholder={devicesLoading ? "Loading devices..." : "Select device"} />
                        </SelectTrigger>
                        <SelectContent>
                          {devices.map(device => (
                            <SelectItem key={device.id} value={device.id}>
                              {device.name} ({device.macAddress || device.deviceId || device.serialNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    Save & Continue
                  </Button>
                </form>
              )}
              {studentStep === 2 && createdStudentId && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium">Step 2: Scan Fingerprint & RFID</h3>
                    <p className="text-sm text-gray-500">Please scan the student's fingerprint and RFID card.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCurrentUserId(createdStudentId);
                        setScanMode('ENROLL');
                      }}
                      className="w-full"
                    >
                      <Fingerprint className="mr-2 h-4 w-4" />
                      {biometricData ? "Rescan Fingerprint" : "Scan Fingerprint"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCurrentUserId(createdStudentId);
                        setScanMode('SCAN');
                      }}
                      className="w-full"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {rfidData ? "Rescan RFID Card" : "Scan RFID Card"}
                    </Button>
                  </div>
                  {(biometricData && rfidData) && (
                    <Button
                      type="button"
                      className="w-full"
                      onClick={async () => {
                        // Set registrationStatus to COMPLETED
                        if (createdStudentId) {
                          await fetch(`/api/users/${createdStudentId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ registrationStatus: 'COMPLETED' }),
                          });
                        }
                        toast.success("Student registration complete!");
                        setStudentStep(1);
                        setCreatedStudentId(null);
                        setBiometricData(null);
                        setRfidData(null);
                        window.location.reload();
                      }}
                    >
                      Finish & Register Another Student
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="lecturers">
              <form onSubmit={handleLecturerRegistration} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lecturer-name">Full Name</Label>
                    <Input 
                      id="lecturer-name" 
                      name="name" 
                      autoComplete="name"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lecturer-email">Email</Label>
                    <Input 
                      id="lecturer-email" 
                      name="email" 
                      type="email" 
                      autoComplete="email"
                      placeholder="username@staff.unilorin.edu.ng"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lecturer-staffId">Staff ID</Label>
                    <Input 
                      id="lecturer-staffId" 
                      name="staffId" 
                      autoComplete="off"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lecturer-password">Password</Label>
                    <Input 
                      id="lecturer-password" 
                      name="password" 
                      type="password" 
                      autoComplete="new-password"
                      required 
                      minLength={8}
                    />
                  </div>
                </div>

                  <div className="space-y-2">
                    <Label htmlFor="lecturer-confirmPassword">Confirm Password</Label>
                    <Input 
                      id="lecturer-confirmPassword" 
                      name="confirmPassword" 
                      type="password" 
                      autoComplete="new-password"
                      required 
                      minLength={8}
                    />
                  </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lecturer-faculty">Faculty</Label>
                    <Select 
                      name="faculty" 
                      value={selectedFaculty}
                      onValueChange={handleFacultyChange}
                      required
                    >
                      <SelectTrigger id="lecturer-faculty">
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
                    <Label htmlFor="lecturer-department">Department</Label>
                    <Select 
                      name="department" 
                      value={selectedDepartment}
                      onValueChange={setSelectedDepartment}
                      required
                      disabled={!selectedFaculty}
                    >
                      <SelectTrigger id="lecturer-department">
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
                  <div className="space-y-2">
                    <Label htmlFor="lecturer-register-device">Assign Device</Label>
                    <Select
                      value={selectedDeviceId}
                      onValueChange={setSelectedDeviceId}
                      disabled={devicesLoading || devices.length === 0}
                    >
                      <SelectTrigger id="lecturer-register-device">
                        <SelectValue placeholder={devicesLoading ? "Loading devices..." : "Select device"} />
                      </SelectTrigger>
                      <SelectContent>
                        {devices.map(device => (
                          <SelectItem key={device.id} value={device.id}>
                            {device.name} ({device.macAddress || device.deviceId || device.serialNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
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
                  <TableHead>Fingerprint ID</TableHead>
                  <TableHead>RFID UID</TableHead>
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
                    <TableCell>{user.fingerprintId || "-"}</TableCell>
                    <TableCell>{user.rfidUid || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditUser(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)} disabled={isLoading}>
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
              userId={currentUserId || undefined}
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

      {editUser && (
        <EditUserModal
          user={editUser}
          open={!!editUser}
          onClose={() => setEditUser(null)}
          onSave={() => window.location.reload()}
        />
      )}
    </div>
  )
} 