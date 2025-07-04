const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteAllDevices() {
  try {
    // Delete all related records first
    await prisma.attendanceRecord.deleteMany({});
    await prisma.deviceCommand.deleteMany({});
    await prisma.deviceStatus.deleteMany({});
    await prisma.courseDevice.deleteMany({});
    // Add more deletions here if you have other device-related tables

    // Delete all devices
    await prisma.device.deleteMany({});

    console.log('All devices and related records deleted successfully.');
  } catch (error) {
    console.error('Error deleting devices:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllDevices(); 