/*
  Warnings:

  - You are about to drop the column `resource` on the `AuditLog` table. All the data in the column will be lost.
  - Added the required column `entity` to the `AuditLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Device" ADD COLUMN "lastSync" DATETIME;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "departmentId" TEXT;
ALTER TABLE "User" ADD COLUMN "facultyId" TEXT;

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AuditLog" ("action", "createdAt", "details", "id", "ipAddress", "resourceId", "userAgent", "userId") SELECT "action", "createdAt", "details", "id", "ipAddress", "resourceId", "userAgent", "userId" FROM "AuditLog";
DROP TABLE "AuditLog";
ALTER TABLE "new_AuditLog" RENAME TO "AuditLog";
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lecturerId" TEXT NOT NULL,
    CONSTRAINT "Course_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Course" ("academicYear", "code", "createdAt", "department", "description", "faculty", "id", "lecturerId", "level", "maxCapacity", "semester", "title", "units", "updatedAt") SELECT "academicYear", "code", "createdAt", "department", "description", "faculty", "id", "lecturerId", "level", "maxCapacity", "semester", "title", "units", "updatedAt" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");
CREATE INDEX "Course_code_idx" ON "Course"("code");
CREATE INDEX "Course_faculty_department_idx" ON "Course"("faculty", "department");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
