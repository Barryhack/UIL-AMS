"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
import { Fingerprint, CreditCard, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Stepper } from "@/components/ui/stepper"
import { faculties } from "@/lib/constants/faculties"
import { userRegistrationSchema, type UserRegistrationData } from "@/lib/schemas/user"
import { hardwareService } from "@/lib/services/hardware-service"
import { HardwareScanner } from "./HardwareScanner"

type ScanMode = 'rfid' | 'fingerprint' | 'enroll' | null;
type HardwareScannerMode = 'SCAN' | 'ENROLL';

const steps = [
  {
    title: "Personal Info",
    description: "Basic information",
  },
  {
    title: "Academic Info",
    description: "Faculty & Department",
  },
  {
    title: "Biometric",
    description: "Fingerprint scan",
  },
  {
    title: "RFID",
    description: "Card scan",
  },
]

interface UserRegistrationFormProps {
  open: boolean
  onClose: () => void
}

export function UserRegistrationForm({ open, onClose }: UserRegistrationFormProps) {
  const [step, setStep] = useState(0)
  const [selectedFaculty, setSelectedFaculty] = useState<string>("")
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanMode, setScanMode] = useState<ScanMode>(null)
  const [userId, setUserId] = useState<number | undefined>(undefined)

  const form = useForm<UserRegistrationData>({
    resolver: zodResolver(userRegistrationSchema),
    defaultValues: {
      role: "STUDENT",
    },
  })

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = form

  const onSubmit = async (data: UserRegistrationData) => {
    try {
      if (!data.biometricData || !data.rfidData) {
        toast.error("Both fingerprint and RFID card scans are required")
        return
      }
      
      // TODO: Implement API call to save user data
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success("User registered successfully")
      onClose()
    } catch (error) {
      toast.error("Failed to register user. Please try again.")
    }
  }

  const handleRFIDScanned = (data: string) => {
    setValue("rfidData", data)
    toast.success("RFID card scanned successfully")
    setScanMode(null)
    if (!watch("biometricData")) {
      setStep(2)
    } else {
      handleSubmit(onSubmit)()
    }
  }

  const handleFingerprintScanned = (data: string) => {
    setValue("biometricData", data)
    toast.success("Fingerprint captured successfully")
    setScanMode(null)
    if (!watch("rfidData")) {
      setStep(3)
    } else {
      handleSubmit(onSubmit)()
    }
  }

  const handleFingerprintEnrolled = (data: string) => {
    setValue("biometricData", data)
    toast.success("Fingerprint enrolled successfully")
    setScanMode(null)
    if (!watch("rfidData")) {
      setStep(3)
    } else {
      handleSubmit(onSubmit)()
    }
  }

  const handleBiometricCapture = async () => {
    try {
      setIsScanning(true)
      setScanError(null)

      if (!hardwareService.isConnected()) {
        throw new Error("Fingerprint scanner is not connected")
      }

      await hardwareService.scanFingerprint(userId || 0)
    } catch (error) {
      console.error("Biometric capture error:", error)
      setScanError(error instanceof Error ? error.message : "Failed to capture biometric data")
      toast.error(error instanceof Error ? error.message : "Failed to capture biometric data")
    } finally {
      setIsScanning(false)
    }
  }

  const handleRFIDCapture = async () => {
    try {
      setIsScanning(true)
      setScanError(null)

      if (!hardwareService.isConnected()) {
        throw new Error("RFID reader is not connected")
      }

      await hardwareService.scanRFID()
    } catch (error) {
      console.error("RFID capture error:", error)
      setScanError(error instanceof Error ? error.message : "Failed to scan RFID card")
      toast.error(error instanceof Error ? error.message : "Failed to scan RFID card")
    } finally {
      setIsScanning(false)
    }
  }

  const handleScanComplete = (result: { success: boolean; data?: string; error?: string }) => {
    // ... rest of the code ...
  }

  const handleError = (error: Error) => {
    // ... rest of the code ...
  }

  const getScannerMode = (mode: ScanMode): HardwareScannerMode => {
    return mode === 'enroll' ? 'ENROLL' : 'SCAN';
  };

  // Update the biometric step UI
  const BiometricStep = (
    <Card>
      <CardContent className="pt-6 pb-4">
        {scanError && (
          <Alert variant="danger" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{scanError}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <Fingerprint className={`h-16 w-16 ${watch("biometricData") ? "text-green-500" : "text-gray-400"}`} />
            {!watch("biometricData") && (
              <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">*</div>
            )}
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium">Scan Fingerprint</h3>
            <p className="text-sm text-gray-500">
              {watch("biometricData") 
                ? "Fingerprint successfully captured" 
                : "Place your finger on the scanner when ready"}
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setScanMode('enroll')}
            disabled={isScanning}
            className="w-full"
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning Fingerprint...
              </>
            ) : (
              <>
                <Fingerprint className="mr-2 h-4 w-4" />
                {watch("biometricData") ? "Scan Again" : "Scan Fingerprint"}
              </>
            )}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          onClick={() => setStep(3)}
          disabled={!watch("biometricData")}
        >
          Next
        </Button>
      </CardFooter>
    </Card>
  )

  // Update the RFID step UI
  const RFIDStep = (
    <Card>
      <CardContent className="pt-6 pb-4">
        {scanError && (
          <Alert variant="danger" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{scanError}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <CreditCard className={`h-16 w-16 ${watch("rfidData") ? "text-green-500" : "text-gray-400"}`} />
            {!watch("rfidData") && (
              <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">*</div>
            )}
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium">Scan RFID Card</h3>
            <p className="text-sm text-gray-500">
              {watch("rfidData")
                ? "RFID card successfully scanned"
                : "Place your RFID card on the reader when ready"}
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setScanMode('rfid')}
            disabled={isScanning}
            className="w-full"
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning Card...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {watch("rfidData") ? "Scan Again" : "Scan RFID Card"}
              </>
            )}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(2)}
        >
          Previous
        </Button>
        <Button
          type="submit"
          disabled={!watch("rfidData") || !watch("biometricData") || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering...
            </>
          ) : (
            "Complete Registration"
          )}
        </Button>
      </CardFooter>
    </Card>
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        
        <Stepper steps={steps} currentStep={step} className="mb-8" />

        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="personal-info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-firstName">First Name</Label>
                        <Input
                          id="register-firstName"
                          autoComplete="given-name"
                          {...register("firstName")}
                          className={errors.firstName ? "border-red-500" : ""}
                        />
                        {errors.firstName && (
                          <p className="text-sm text-red-500" id="firstName-error">
                            {errors.firstName.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-lastName">Last Name</Label>
                        <Input
                          id="register-lastName"
                          autoComplete="family-name"
                          {...register("lastName")}
                          className={errors.lastName ? "border-red-500" : ""}
                          aria-describedby={errors.lastName ? "lastName-error" : undefined}
                        />
                        {errors.lastName && (
                          <p className="text-sm text-red-500" id="lastName-error">
                            {errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        autoComplete="email"
                        placeholder="user@unilorin.edu.ng"
                        {...register("email")}
                        className={errors.email ? "border-red-500" : ""}
                        aria-describedby={errors.email ? "email-error" : undefined}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500" id="email-error">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <Input
                          id="register-password"
                          type="password"
                          autoComplete="new-password"
                          {...register("password")}
                          className={errors.password ? "border-red-500" : ""}
                          aria-describedby={errors.password ? "password-error" : undefined}
                        />
                        {errors.password && (
                          <p className="text-sm text-red-500" id="password-error">
                            {errors.password.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-confirmPassword">Confirm Password</Label>
                        <Input
                          id="register-confirmPassword"
                          type="password"
                          autoComplete="new-password"
                          {...register("confirmPassword")}
                          className={errors.confirmPassword ? "border-red-500" : ""}
                          aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                        />
                        {errors.confirmPassword && (
                          <p className="text-sm text-red-500" id="confirmPassword-error">
                            {errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-role">Role</Label>
                      <Select
                        value={watch("role")}
                        onValueChange={(value: "ADMIN" | "LECTURER" | "STUDENT") => setValue("role", value)}
                      >
                        <SelectTrigger id="register-role" aria-label="Select role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem id="register-role-admin" value="ADMIN">Admin</SelectItem>
                          <SelectItem id="register-role-lecturer" value="LECTURER">Lecturer</SelectItem>
                          <SelectItem id="register-role-student" value="STUDENT">Student</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.role && (
                        <p className="text-sm text-red-500" id="role-error">
                          {errors.role.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end space-x-2">
                    <Button
                      type="button"
                      onClick={() => setStep(1)}
                    >
                      Next
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="academic-info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="register-faculty">Faculty</Label>
                      <Select
                        value={selectedFaculty}
                        onValueChange={(value) => {
                          setSelectedFaculty(value)
                          setValue("faculty", value)
                          setValue("department", "")
                        }}
                      >
                        <SelectTrigger id="register-faculty" aria-label="Select faculty">
                          <SelectValue placeholder="Select faculty" />
                        </SelectTrigger>
                        <SelectContent>
                          {faculties.map((faculty) => (
                            <SelectItem 
                              key={faculty.id} 
                              value={faculty.id}
                              id={`register-faculty-${faculty.id}`}
                            >
                              {faculty.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.faculty && (
                        <p className="text-sm text-red-500" id="faculty-error">
                          {errors.faculty.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-department">Department</Label>
                      <Select
                        value={watch("department")}
                        onValueChange={(value) => setValue("department", value)}
                        disabled={!selectedFaculty}
                      >
                        <SelectTrigger id="register-department" aria-label="Select department">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedFaculty && faculties
                            .find((f) => f.id === selectedFaculty)
                            ?.departments.map((dept) => (
                              <SelectItem 
                                key={dept} 
                                value={dept}
                                id={`register-department-${dept.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                {dept}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {errors.department && (
                        <p className="text-sm text-red-500" id="department-error">
                          {errors.department.message}
                        </p>
                      )}
                    </div>

                    {watch("role") === "STUDENT" && (
                      <div className="space-y-2">
                        <Label htmlFor="register-matricNumber">Matric Number</Label>
                        <Input
                          id="register-matricNumber"
                          autoComplete="off"
                          {...register("matricNumber")}
                          className={errors.matricNumber ? "border-red-500" : ""}
                          aria-describedby={errors.matricNumber ? "matricNumber-error" : undefined}
                        />
                        {errors.matricNumber && (
                          <p className="text-sm text-red-500" id="matricNumber-error">
                            {errors.matricNumber.message}
                          </p>
                        )}
                      </div>
                    )}

                    {watch("role") === "LECTURER" && (
                      <div className="space-y-2">
                        <Label htmlFor="register-staffId">Staff ID</Label>
                        <Input
                          id="register-staffId"
                          autoComplete="off"
                          {...register("staffId")}
                          className={errors.staffId ? "border-red-500" : ""}
                          aria-describedby={errors.staffId ? "staffId-error" : undefined}
                        />
                        {errors.staffId && (
                          <p className="text-sm text-red-500" id="staffId-error">
                            {errors.staffId.message}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(0)}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(2)}
                    >
                      Next
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="biometric"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {BiometricStep}
                {scanMode && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                    <div className="bg-white p-6 rounded-lg w-96 relative z-[10000]">
                      <h2 className="text-lg font-semibold mb-4">
                        {scanMode === 'rfid' ? 'Scan RFID Card' :
                         scanMode === 'fingerprint' ? 'Scan Fingerprint' :
                         'Enroll Fingerprint'}
                      </h2>
                      <HardwareScanner
                        mode={getScannerMode(scanMode)}
                        userId={userId}
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
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="rfid"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {RFIDStep}
              </motion.div>
            )}
          </AnimatePresence>

          {Object.keys(errors).length > 0 && (
            <Alert variant="danger" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please fix the errors above before proceeding.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
} 