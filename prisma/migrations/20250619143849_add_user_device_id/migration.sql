-- AlterTable
ALTER TABLE "User" ADD COLUMN "deviceId" TEXT;

-- CreateIndex
CREATE INDEX "User_deviceId_idx" ON "User"("deviceId");
