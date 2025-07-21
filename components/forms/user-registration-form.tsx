"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { faculties } from "@/lib/constants/faculties"
import { userRegistrationSchema, type UserRegistrationData } from "@/lib/schemas/user"
import { BiometricEnrollmentForm } from "@/components/biometrics/enrollment-form"

interface UserRegistrationFormProps {
  open: boolean
  onClose: () => void
}

export function UserRegistrationForm({ open, onClose }: UserRegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFaculty, setSelectedFaculty] = useState<string>("")
  const [registrationStep, setRegistrationStep] = useState(1) // 1: basic info, 2: biometric
  const [createdUserId, setCreatedUserId] = useState<string | null>(null)
  const [devices, setDevices] = useState<any[]>([])
  const [devicesLoading, setDevicesLoading] = useState(false)

  const form = useForm<UserRegistrationData>({
    resolver: zodResolver(userRegistrationSchema),
    defaultValues: {
      role: "STUDENT",
    },
  })

  const { register, handleSubmit, formState: { errors }, watch, setValue } = form

  useEffect(() => {
    if (!open) return
    
    // Reset form state when dialog opens or closes
    form.reset()
    setCreatedUserId(null)
    setRegistrationStep(1)
    setSelectedFaculty("")
    
    // Fetch devices
    setDevicesLoading(true)
    fetch("/api/admin/devices", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setDevices(Array.isArray(data) ? data : [])
        setDevicesLoading(false)
      })
      .catch(() => {
        toast.error("Failed to load devices.")
        setDevicesLoading(false)
      })
  }, [open, form])

  const handleFacultyChange = (facultyId: string) => {
    setSelectedFaculty(facultyId)
    setValue("department", "")
  }

  const handleBasicInfoSubmit = async (data: UserRegistrationData) => {
    setIsLoading(true)
    try {
      if (!data.deviceId) {
        throw new Error("Device assignment is required")
      }
      
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          name: `${data.firstName} ${data.lastName}`,
          faculty: selectedFaculty,
        }),
      })
      
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Failed to register user")
      }
      
      setCreatedUserId(result.user.id)
      setRegistrationStep(2)
      toast.success("Basic info saved. Proceed to biometric enrollment.")
    } catch (error) {
      console.error("Registration error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to register user")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBiometricComplete = (data: { fingerprintData?: string; rfidData?: string }) => {
    // The BiometricEnrollmentForm already handles the API calls to update the user.
    // We just need to show a final success message and close the dialog.
    toast.success("User registration complete!")
    onClose()
  }

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        
        {registrationStep === 1 ? (
          <form onSubmit={handleSubmit(handleBasicInfoSubmit)} className="space-y-6">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      {...register("firstName")}
                      className={errors.firstName ? "border-red-500" : ""}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-500">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      {...register("lastName")}
                      className={errors.lastName ? "border-red-500" : ""}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-500">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="user@students.unilorin.edu.ng or user@unilorin.edu.ng"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      {...register("password")}
                      className={errors.password ? "border-red-500" : ""}
                    />
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...register("confirmPassword")}
                      className={errors.confirmPassword ? "border-red-500" : ""}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={watch("role")}
                    onValueChange={(value) => setValue("role", value as "ADMIN" | "LECTURER" | "STUDENT")}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="LECTURER">Lecturer</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-red-500">{errors.role.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="faculty">Faculty</Label>
                    <Select
                      value={selectedFaculty}
                      onValueChange={handleFacultyChange}
                    >
                      <SelectTrigger id="faculty">
                        <SelectValue placeholder="Select faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculties.map((faculty) => (
                          <SelectItem key={faculty.id} value={faculty.id}>
                            {faculty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={watch("department") || ""}
                      onValueChange={(value) => setValue("department", value)}
                      disabled={!selectedFaculty}
                    >
                      <SelectTrigger id="department">
                        <SelectValue placeholder={selectedFaculty ? "Select department" : "Select faculty first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedFaculty && faculties
                          .find(f => f.id === selectedFaculty)
                          ?.departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {errors.department && (
                      <p className="text-sm text-red-500">{errors.department.message}</p>
                    )}
                  </div>
                </div>

                {watch("role") === "STUDENT" && (
                  <div className="space-y-2">
                    <Label htmlFor="matricNumber">Matric Number</Label>
                    <Input
                      id="matricNumber"
                      {...register("matricNumber")}
                      className={errors.matricNumber ? "border-red-500" : ""}
                    />
                    {errors.matricNumber && (
                      <p className="text-sm text-red-500">{errors.matricNumber.message}</p>
                    )}
                  </div>
                )}

                {watch("role") === "LECTURER" && (
                  <div className="space-y-2">
                    <Label htmlFor="staffId">Staff ID</Label>
                    <Input
                      id="staffId"
                      {...register("staffId")}
                      className={errors.staffId ? "border-red-500" : ""}
                    />
                    {errors.staffId && (
                      <p className="text-sm text-red-500">{errors.staffId.message}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="deviceId">Assign Device</Label>
                  <Select
                    value={watch("deviceId") || ""}
                    onValueChange={(value) => setValue("deviceId", value)}
                    disabled={devicesLoading || devices.length === 0}
                  >
                    <SelectTrigger id="deviceId">
                      <SelectValue placeholder={devicesLoading ? "Loading devices..." : "Select device"} />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map(device => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.name} ({device.macAddress || device.deviceId || "N/A"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.deviceId && (
                    <p className="text-sm text-red-500">{errors.deviceId.message}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save & Continue to Biometric"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        ) : (
          <BiometricEnrollmentForm
            userId={createdUserId!}
            userName={`${form.getValues("firstName")} ${form.getValues("lastName")}`}
            deviceId={form.getValues("deviceId")!}
            onComplete={handleBiometricComplete}
            onCancel={() => setRegistrationStep(1)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
} 