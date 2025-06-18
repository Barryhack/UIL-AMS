/*
  Warnings:

  - Added the required column `updatedAt` to the `AttendanceRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `verificationMethod` to the `AttendanceRecord` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "BiometricData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "templateData" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "verifiedAt" DATETIME,
    "failedScans" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BiometricData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RFIDTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RFIDTag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    CONSTRAINT "AttendanceRecord_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AttendanceRecord" ("deviceId", "id", "metadata", "sessionId", "status", "studentId", "syncedAt", "timestamp", "type") SELECT "deviceId", "id", "metadata", "sessionId", "status", "studentId", "syncedAt", "timestamp", "type" FROM "AttendanceRecord";
DROP TABLE "AttendanceRecord";
ALTER TABLE "new_AttendanceRecord" RENAME TO "AttendanceRecord";
CREATE INDEX "AttendanceRecord_sessionId_idx" ON "AttendanceRecord"("sessionId");
CREATE INDEX "AttendanceRecord_deviceId_idx" ON "AttendanceRecord"("deviceId");
CREATE INDEX "AttendanceRecord_studentId_idx" ON "AttendanceRecord"("studentId");
CREATE INDEX "AttendanceRecord_timestamp_idx" ON "AttendanceRecord"("timestamp");
CREATE INDEX "AttendanceRecord_status_idx" ON "AttendanceRecord"("status");
CREATE INDEX "AttendanceRecord_verificationMethod_idx" ON "AttendanceRecord"("verificationMethod");
CREATE TABLE "new_Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "ipAddress" TEXT,
    "macAddress" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "mode" TEXT NOT NULL DEFAULT 'ONLINE',
    "type" TEXT NOT NULL DEFAULT 'HYBRID',
    "firmwareVersion" TEXT,
    "lastSynced" DATETIME,
    "lastMaintenance" DATETIME,
    "locationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Device_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Device" ("createdAt", "id", "lastSynced", "locationId", "mode", "name", "serialNumber", "status", "updatedAt") SELECT "createdAt", "id", "lastSynced", "locationId", "mode", "name", "serialNumber", "status", "updatedAt" FROM "Device";
DROP TABLE "Device";
ALTER TABLE "new_Device" RENAME TO "Device";
CREATE UNIQUE INDEX "Device_serialNumber_key" ON "Device"("serialNumber");
CREATE UNIQUE INDEX "Device_macAddress_key" ON "Device"("macAddress");
CREATE INDEX "Device_locationId_idx" ON "Device"("locationId");
CREATE INDEX "Device_status_idx" ON "Device"("status");
CREATE INDEX "Device_mode_idx" ON "Device"("mode");
CREATE INDEX "Device_type_idx" ON "Device"("type");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "BiometricData_userId_key" ON "BiometricData"("userId");

-- CreateIndex
CREATE INDEX "BiometricData_userId_idx" ON "BiometricData"("userId");

-- CreateIndex
CREATE INDEX "BiometricData_status_idx" ON "BiometricData"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDTag_userId_key" ON "RFIDTag"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RFIDTag_tagId_key" ON "RFIDTag"("tagId");

-- CreateIndex
CREATE INDEX "RFIDTag_userId_idx" ON "RFIDTag"("userId");

-- CreateIndex
CREATE INDEX "RFIDTag_tagId_idx" ON "RFIDTag"("tagId");
