/*
  Warnings:

  - Added the required column `date` to the `AttendanceSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AttendanceRecord" ADD COLUMN "userId" TEXT;

-- CreateTable
CREATE TABLE "DeviceRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeviceRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeviceVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeviceVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "userId" TEXT,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABSENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Attendance_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Attendance" ("courseId", "createdAt", "date", "id", "status", "studentId", "updatedAt") SELECT "courseId", "createdAt", "date", "id", "status", "studentId", "updatedAt" FROM "Attendance";
DROP TABLE "Attendance";
ALTER TABLE "new_Attendance" RENAME TO "Attendance";
CREATE INDEX "Attendance_courseId_idx" ON "Attendance"("courseId");
CREATE INDEX "Attendance_studentId_idx" ON "Attendance"("studentId");
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");
CREATE UNIQUE INDEX "Attendance_courseId_studentId_date_key" ON "Attendance"("courseId", "studentId", "date");
CREATE TABLE "new_AttendanceSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "date" DATETIME NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "type" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "location" TEXT,
    "deviceId" TEXT,
    "requiresFingerprint" BOOLEAN NOT NULL DEFAULT false,
    "requiresRFID" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AttendanceSession_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AttendanceSession_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AttendanceSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AttendanceSession" ("courseId", "createdAt", "deviceId", "endTime", "id", "location", "scheduleId", "startTime", "status", "type", "updatedAt") SELECT "courseId", "createdAt", "deviceId", "endTime", "id", "location", "scheduleId", "startTime", "status", "type", "updatedAt" FROM "AttendanceSession";
DROP TABLE "AttendanceSession";
ALTER TABLE "new_AttendanceSession" RENAME TO "AttendanceSession";
CREATE INDEX "AttendanceSession_courseId_idx" ON "AttendanceSession"("courseId");
CREATE INDEX "AttendanceSession_scheduleId_idx" ON "AttendanceSession"("scheduleId");
CREATE INDEX "AttendanceSession_status_idx" ON "AttendanceSession"("status");
CREATE INDEX "AttendanceSession_deviceId_idx" ON "AttendanceSession"("deviceId");
CREATE TABLE "new_Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "units" INTEGER NOT NULL DEFAULT 3,
    "creditHours" INTEGER NOT NULL DEFAULT 3,
    "capacity" INTEGER NOT NULL DEFAULT 60,
    "level" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "venue" TEXT,
    "maxCapacity" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lecturerId" TEXT NOT NULL,
    CONSTRAINT "Course_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Course" ("academicYear", "capacity", "code", "createdAt", "creditHours", "department", "description", "faculty", "id", "lecturerId", "level", "maxCapacity", "semester", "title", "units", "updatedAt", "venue") SELECT "academicYear", "capacity", "code", "createdAt", "creditHours", "department", "description", "faculty", "id", "lecturerId", "level", "maxCapacity", "semester", "title", "units", "updatedAt", "venue" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");
CREATE INDEX "Course_code_idx" ON "Course"("code");
CREATE INDEX "Course_faculty_department_idx" ON "Course"("faculty", "department");
CREATE TABLE "new_Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "ip_address" TEXT,
    "mac_address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "mode" TEXT NOT NULL DEFAULT 'ONLINE',
    "type" TEXT NOT NULL DEFAULT 'HYBRID',
    "firmwareVersion" TEXT,
    "lastSynced" DATETIME,
    "lastSync" DATETIME,
    "lastSeen" DATETIME,
    "lastStatusMessage" TEXT,
    "lastTest" DATETIME,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastMaintenance" DATETIME,
    "locationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deviceId" TEXT NOT NULL,
    CONSTRAINT "Device_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Device" ("createdAt", "deviceId", "firmwareVersion", "id", "ip_address", "lastMaintenance", "lastSync", "lastSynced", "locationId", "mac_address", "mode", "name", "serialNumber", "status", "type", "updatedAt") SELECT "createdAt", "deviceId", "firmwareVersion", "id", "ip_address", "lastMaintenance", "lastSync", "lastSynced", "locationId", "mac_address", "mode", "name", "serialNumber", "status", "type", "updatedAt" FROM "Device";
DROP TABLE "Device";
ALTER TABLE "new_Device" RENAME TO "Device";
CREATE UNIQUE INDEX "Device_serialNumber_key" ON "Device"("serialNumber");
CREATE UNIQUE INDEX "Device_mac_address_key" ON "Device"("mac_address");
CREATE UNIQUE INDEX "Device_deviceId_key" ON "Device"("deviceId");
CREATE INDEX "Device_locationId_idx" ON "Device"("locationId");
CREATE TABLE "new_Justification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attendanceId" TEXT NOT NULL,
    "recordId" TEXT,
    "studentId" TEXT,
    "reason" TEXT NOT NULL,
    "supportingDocument" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Justification_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Justification_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "AttendanceRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Justification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Justification" ("attendanceId", "comment", "createdAt", "id", "reason", "status", "supportingDocument", "updatedAt") SELECT "attendanceId", "comment", "createdAt", "id", "reason", "status", "supportingDocument", "updatedAt" FROM "Justification";
DROP TABLE "Justification";
ALTER TABLE "new_Justification" RENAME TO "Justification";
CREATE UNIQUE INDEX "Justification_attendanceId_key" ON "Justification"("attendanceId");
CREATE UNIQUE INDEX "Justification_recordId_key" ON "Justification"("recordId");
CREATE INDEX "Justification_status_idx" ON "Justification"("status");
CREATE TABLE "new_Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ROOM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Location" ("createdAt", "id", "name", "updatedAt") SELECT "createdAt", "id", "name", "updatedAt" FROM "Location";
DROP TABLE "Location";
ALTER TABLE "new_Location" RENAME TO "Location";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "DeviceRegistration_deviceId_key" ON "DeviceRegistration"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceRegistration_deviceId_idx" ON "DeviceRegistration"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceRegistration_userId_idx" ON "DeviceRegistration"("userId");

-- CreateIndex
CREATE INDEX "DeviceVerification_deviceId_idx" ON "DeviceVerification"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceVerification_userId_idx" ON "DeviceVerification"("userId");
