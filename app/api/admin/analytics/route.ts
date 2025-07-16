import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Attendance by week (last 8 weeks)
    const attendanceByWeek = await prisma.$queryRaw`
      SELECT to_char(date_trunc('week', date), 'IW YYYY') as week, COUNT(id) as count
      FROM "Attendance"
      WHERE date >= NOW() - INTERVAL '8 weeks'
      GROUP BY week
      ORDER BY MIN(date)
    ` as any[];

    // Attendance by department
    const attendanceByDepartment = await prisma.$queryRaw`
      SELECT u."department" as department, COUNT(a.id) as count
      FROM "Attendance" a
      JOIN "User" u ON a."studentId" = u.id
      GROUP BY u."department"
      ORDER BY count DESC
    ` as any[];

    // Fingerprint scan stats (from AttendanceRecord)
    const totalFingerprint = await prisma.attendanceRecord.count({
      where: { verificationMethod: "FINGERPRINT" }
    });
    const fingerprintSuccess = await prisma.attendanceRecord.count({
      where: { verificationMethod: "FINGERPRINT", status: { in: ["VERIFIED", "PRESENT"] } }
    });
    const fingerprintFailure = await prisma.attendanceRecord.count({
      where: { verificationMethod: "FINGERPRINT", status: { notIn: ["VERIFIED", "PRESENT"] } }
    });
    const fingerprintSuccessRate = totalFingerprint > 0 ? (fingerprintSuccess / totalFingerprint) * 100 : 0;

    // Device error count (from DeviceStatus)
    const deviceErrors = await prisma.deviceStatus.count({
      where: { status: "ERROR" }
    });

    // API failure count (from AuditLog)
    const apiFailures = await prisma.auditLog.count({
      where: { action: { contains: "ERROR" } }
    });

    return NextResponse.json({
      attendanceByWeek: attendanceByWeek.map((w: any) => ({ name: w.week, value: Number(w.count) })),
      attendanceByDepartment: attendanceByDepartment.map((d: any) => ({ name: d.department, value: Number(d.count) })),
      fingerprintStats: {
        total: totalFingerprint,
        success: fingerprintSuccess,
        failure: fingerprintFailure,
        successRate: Math.round(fingerprintSuccessRate * 100) / 100
      },
      deviceErrors,
      apiFailures
    })
  } catch (error) {
    console.error("Error in GET /api/admin/analytics:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
} 