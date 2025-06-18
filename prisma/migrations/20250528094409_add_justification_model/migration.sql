/*
  Warnings:

  - A unique constraint covering the columns `[courseId,studentId,date]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "Justification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attendanceId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "supportingDocument" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Justification_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Justification_attendanceId_key" ON "Justification"("attendanceId");

-- CreateIndex
CREATE INDEX "Justification_status_idx" ON "Justification"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_courseId_studentId_date_key" ON "Attendance"("courseId", "studentId", "date");
