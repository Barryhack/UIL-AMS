import prisma from "@/lib/prisma"

interface AuditLogData {
  action: string
  details: string
  userId?: string
  entity: string
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        details: data.details,
        userId: data.userId,
        entity: data.entity,
      },
    })
  } catch (error) {
    console.error("Error creating audit log:", error)
    throw error
  }
}

export async function getAuditLogs(limit = 100, offset = 0, userId?: string) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    })
    return { success: true, logs }
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return { success: false, error }
  }
}
