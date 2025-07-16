const { PrismaClient: SqliteClient } = require('@prisma/client');
const { PrismaClient: PostgresClient } = require('@prisma/client');

// SQLite client (old DB)
const sqlite = new SqliteClient({
  datasources: { db: { url: 'file:./prisma/dev.db' } }
});
// Postgres client (new DB, uses DATABASE_URL)
const postgres = new PostgresClient();

async function migrate() {
  // 1. Users
  const users = await sqlite.user.findMany();
  for (const user of users) {
    await postgres.user.create({ data: user });
  }

  // 2. Locations
  const locations = await sqlite.location.findMany();
  for (const location of locations) {
    await postgres.location.create({ data: location });
  }

  // 3. Devices
  const devices = await sqlite.device.findMany();
  for (const device of devices) {
    await postgres.device.create({ data: device });
  }

  // 4. Courses
  const courses = await sqlite.course.findMany();
  for (const course of courses) {
    await postgres.course.create({ data: course });
  }

  // 5. Schedules
  const schedules = await sqlite.schedule.findMany();
  for (const schedule of schedules) {
    await postgres.schedule.create({ data: schedule });
  }

  // 6. CourseDevice
  const courseDevices = await sqlite.courseDevice.findMany();
  for (const cd of courseDevices) {
    await postgres.courseDevice.create({ data: cd });
  }

  // 7. CourseEnrollment
  const enrollments = await sqlite.courseEnrollment.findMany();
  for (const enrollment of enrollments) {
    await postgres.courseEnrollment.create({ data: enrollment });
  }

  // 8. Attendance
  const attendances = await sqlite.attendance.findMany();
  for (const attendance of attendances) {
    await postgres.attendance.create({ data: attendance });
  }

  // 9. AttendanceSession
  const sessions = await sqlite.attendanceSession.findMany();
  for (const session of sessions) {
    await postgres.attendanceSession.create({ data: session });
  }

  // 10. AttendanceRecord
  const records = await sqlite.attendanceRecord.findMany();
  for (const record of records) {
    await postgres.attendanceRecord.create({ data: record });
  }

  // 11. Justification
  const justifications = await sqlite.justification.findMany();
  for (const justification of justifications) {
    await postgres.justification.create({ data: justification });
  }

  // 12. BiometricData
  const biometrics = await sqlite.biometricData.findMany();
  for (const bio of biometrics) {
    await postgres.biometricData.create({ data: bio });
  }

  // 13. RFIDTag
  const rfidTags = await sqlite.rFIDTag.findMany();
  for (const tag of rfidTags) {
    await postgres.rFIDTag.create({ data: tag });
  }

  // 14. DeviceStatus
  const deviceStatuses = await sqlite.deviceStatus.findMany();
  for (const status of deviceStatuses) {
    await postgres.deviceStatus.create({ data: status });
  }

  // 15. DeviceCommand
  const deviceCommands = await sqlite.deviceCommand.findMany();
  for (const cmd of deviceCommands) {
    await postgres.deviceCommand.create({ data: cmd });
  }

  // 16. DeviceRegistration
  const deviceRegistrations = await sqlite.deviceRegistration.findMany();
  for (const reg of deviceRegistrations) {
    await postgres.deviceRegistration.create({ data: reg });
  }

  // 17. DeviceVerification
  const deviceVerifications = await sqlite.deviceVerification.findMany();
  for (const ver of deviceVerifications) {
    await postgres.deviceVerification.create({ data: ver });
  }

  // 18. AuditLog
  const auditLogs = await sqlite.auditLog.findMany();
  for (const log of auditLogs) {
    await postgres.auditLog.create({ data: log });
  }

  // 19. Notification
  const notifications = await sqlite.notification.findMany();
  for (const notif of notifications) {
    await postgres.notification.create({ data: notif });
  }

  // 20. Session
  const sessionsTbl = await sqlite.session.findMany();
  for (const s of sessionsTbl) {
    await postgres.session.create({ data: s });
  }

  console.log('Migration complete!');
}

migrate()
  .catch(console.error)
  .finally(async () => {
    await sqlite.$disconnect();
    await postgres.$disconnect();
  }); 