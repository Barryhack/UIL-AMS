/*
  Warnings:

  - A unique constraint covering the columns `[rfidUid]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_rfidUid_key" ON "User"("rfidUid");
