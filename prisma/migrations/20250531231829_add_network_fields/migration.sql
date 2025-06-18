/*
  Warnings:

  - You are about to drop the `Device` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "Device_type_idx";

-- DropIndex
DROP INDEX "Device_mode_idx";

-- DropIndex
DROP INDEX "Device_status_idx";

-- DropIndex
DROP INDEX "Device_locationId_idx";

-- DropIndex
DROP INDEX "Device_macAddress_key";

-- DropIndex
DROP INDEX "Device_serialNumber_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Device";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "devices" (
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
    "lastMaintenance" DATETIME,
    "locationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "devices_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AttendanceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "verificationMethod" TEXT NOT NULL,
    "syncedAt" DATETIME,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AttendanceRecord_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AttendanceRecord" ("createdAt", "deviceId", "id", "metadata", "sessionId", "status", "studentId", "syncedAt", "timestamp", "type", "updatedAt", "verificationMethod") SELECT "createdAt", "deviceId", "id", "metadata", "sessionId", "status", "studentId", "syncedAt", "timestamp", "type", "updatedAt", "verificationMethod" FROM "AttendanceRecord";
DROP TABLE "AttendanceRecord";
ALTER TABLE "new_AttendanceRecord" RENAME TO "AttendanceRecord";
CREATE INDEX "AttendanceRecord_sessionId_idx" ON "AttendanceRecord"("sessionId");
CREATE INDEX "AttendanceRecord_deviceId_idx" ON "AttendanceRecord"("deviceId");
CREATE INDEX "AttendanceRecord_studentId_idx" ON "AttendanceRecord"("studentId");
CREATE INDEX "AttendanceRecord_timestamp_idx" ON "AttendanceRecord"("timestamp");
CREATE INDEX "AttendanceRecord_status_idx" ON "AttendanceRecord"("status");
CREATE INDEX "AttendanceRecord_verificationMethod_idx" ON "AttendanceRecord"("verificationMethod");
CREATE TABLE "new_AttendanceSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "type" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "location" TEXT,
    "deviceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AttendanceSession_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AttendanceSession_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AttendanceSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AttendanceSession" ("courseId", "createdAt", "deviceId", "endTime", "id", "location", "scheduleId", "startTime", "status", "type", "updatedAt") SELECT "courseId", "createdAt", "deviceId", "endTime", "id", "location", "scheduleId", "startTime", "status", "type", "updatedAt" FROM "AttendanceSession";
DROP TABLE "AttendanceSession";
ALTER TABLE "new_AttendanceSession" RENAME TO "AttendanceSession";
CREATE INDEX "AttendanceSession_courseId_idx" ON "AttendanceSession"("courseId");
CREATE INDEX "AttendanceSession_scheduleId_idx" ON "AttendanceSession"("scheduleId");
CREATE INDEX "AttendanceSession_status_idx" ON "AttendanceSession"("status");
CREATE INDEX "AttendanceSession_deviceId_idx" ON "AttendanceSession"("deviceId");
CREATE TABLE "new_CourseDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CourseDevice_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CourseDevice_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CourseDevice" ("courseId", "createdAt", "deviceId", "id", "updatedAt") SELECT "courseId", "createdAt", "deviceId", "id", "updatedAt" FROM "CourseDevice";
DROP TABLE "CourseDevice";
ALTER TABLE "new_CourseDevice" RENAME TO "CourseDevice";
CREATE INDEX "CourseDevice_courseId_idx" ON "CourseDevice"("courseId");
CREATE INDEX "CourseDevice_deviceId_idx" ON "CourseDevice"("deviceId");
CREATE UNIQUE INDEX "CourseDevice_courseId_deviceId_key" ON "CourseDevice"("courseId", "deviceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "devices_serialNumber_key" ON "devices"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "devices_mac_address_key" ON "devices"("mac_address");

-- CreateIndex
CREATE INDEX "devices_locationId_idx" ON "devices"("locationId");

-- CreateIndex
CREATE INDEX "devices_status_idx" ON "devices"("status");

-- CreateIndex
CREATE INDEX "devices_mode_idx" ON "devices"("mode");

-- CreateIndex
CREATE INDEX "devices_type_idx" ON "devices"("type");
