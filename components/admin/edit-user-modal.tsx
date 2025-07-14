import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { faculties } from "@/lib/constants/faculties";
import { toast } from "sonner";
import { Scan, Fingerprint, CreditCard } from "lucide-react";
import { HardwareScanner } from "../forms/HardwareScanner";
import { BiometricScanner } from "@/components/biometrics/biometric-scanner";

export interface EditUserModalProps {
  user: any;
  open: boolean;
  onClose: () => void;
  onSave?: (updatedUser: any) => void;
}

export function EditUserModal({ user, open, onClose, onSave }: EditUserModalProps) {
  const [form, setForm] = useState({ ...user });
  const [loading, setLoading] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(user.faculty || "");
  const [selectedDepartment, setSelectedDepartment] = useState(user.department || "");
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<null | 'ENROLL' | 'SCAN'>(null);
  const [scanningType, setScanningType] = useState<null | 'fingerprint' | 'rfid'>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(user?.id);
  const [devices, setDevices] = useState<any[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);

  useEffect(() => {
    setForm({ ...user });
    setSelectedFaculty(user.faculty || "");
    setSelectedDepartment(user.department || "");
    setError(null);
  }, [user, open]);

  // Fetch devices on mount
  useEffect(() => {
    async function fetchDevices() {
      setDevicesLoading(true);
      try {
        const res = await fetch('/api/devices');
        if (res.ok) {
          const data = await res.json();
          setDevices(data);
        } else {
          setDevices([]);
        }
      } catch {
        setDevices([]);
      } finally {
        setDevicesLoading(false);
      }
    }
    if (open) fetchDevices();
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFacultyChange = (facultyId: string) => {
    setSelectedFaculty(facultyId);
    setSelectedDepartment("");
    setForm((prev) => ({ ...prev, faculty: facultyId, department: "" }));
  };

  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept);
    setForm((prev) => ({ ...prev, department: dept }));
  };

  const handleRoleChange = (role: string) => {
    setForm((prev) => ({ ...prev, role }));
  };

  const handleFingerprintScanned = (fingerprintId: string) => {
    setForm((prev: Record<string, any>) => ({ ...prev, fingerprintId }));
    setScanMode(null);
    setScanningType(null);
    toast.success('Fingerprint scanned successfully!');
  };

  const handleRFIDScanned = (rfidUid: string) => {
    setForm((prev: Record<string, any>) => ({ ...prev, rfidUid }));
    setScanMode(null);
    setScanningType(null);
    toast.success('RFID card scanned successfully!');
  };

  const handleFingerprintEnrolled = (fingerprintId: string) => {
    setForm((prev: Record<string, any>) => ({ ...prev, fingerprintId }));
    setScanMode(null);
    setScanningType(null);
    toast.success('Fingerprint enrolled successfully!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update user");
      }
      toast.success("User updated successfully");
      if (onSave) onSave(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update user");
      toast.error(err.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl" style={{ maxWidth: '100vw', width: '100%' }}>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Edit all user details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input 
                id="edit-name" 
                name="name" 
                value={form.name || ""} 
                onChange={handleChange} 
                autoComplete="name"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input 
                id="edit-email" 
                name="email" 
                value={form.email || ""} 
                onChange={handleChange} 
                autoComplete="email"
                required 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={form.role} onValueChange={handleRoleChange}>
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="LECTURER">Lecturer</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-matricNumber">Matric Number</Label>
              <Input 
                id="edit-matricNumber" 
                name="matricNumber" 
                value={form.matricNumber || ""} 
                onChange={handleChange} 
                autoComplete="off"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-staffId">Staff ID</Label>
              <Input 
                id="edit-staffId" 
                name="staffId" 
                value={form.staffId || ""} 
                onChange={handleChange} 
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-faculty">Faculty</Label>
              <Select value={selectedFaculty} onValueChange={handleFacultyChange}>
                <SelectTrigger id="edit-faculty">
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-department">Department</Label>
              <Select value={selectedDepartment} onValueChange={handleDepartmentChange} disabled={!selectedFaculty}>
                <SelectTrigger id="edit-department">
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-deviceId">Device</Label>
              <Select
                value={form.deviceId || ""}
                onValueChange={deviceId => setForm((prev: Record<string, any>) => ({ ...prev, deviceId }))}
                disabled={devicesLoading}
              >
                <SelectTrigger id="edit-deviceId">
                  <SelectValue placeholder={devicesLoading ? "Loading devices..." : "Select device"} />
                </SelectTrigger>
                <SelectContent>
                  {devices.map(device => (
                    <SelectItem key={device.deviceId || device.id} value={device.deviceId || device.id}>
                      {device.name} ({device.deviceId || device.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Biometric Section */}
          <BiometricScanner
            userId={form.id || user.id}
            userName={form.name || user.name}
            onComplete={({ fingerprintData, rfidData }) => {
              setForm((prev: Record<string, any>) => ({
                ...prev,
                fingerprintId: fingerprintData || prev.fingerprintId,
                rfidUid: rfidData || prev.rfidUid,
              }));
              toast.success('Biometric data updated!');
            }}
            onCancel={() => {}}
          />

          {error && <div className="text-red-500 text-sm">{error}</div>}
          <DialogFooter>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 