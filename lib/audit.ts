import prisma from "@/lib/prisma"

interface AuditLogData {
  action: string
  details: string
  userId?: string
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        details: data.details,
        userId: data.userId,
        timestamp: new Date(),
      },
    })
  } catch (error) {
    console.error("Error creating audit log:", error)
    throw error
  }
}

export async function getAuditLogs(limit = 100, offset = 0, userId?: string) {
  try {
    const query = `
      SELECT * FROM "AuditLog"
      ${userId ? "WHERE userId = $3" : ""}
      ORDER BY createdAt DESC
      LIMIT $1 OFFSET $2
    `

    const params = userId ? [limit, offset, userId] : [limit, offset]
    const logs = await sql(query, params)

    return { success: true, logs }
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return { success: false, error }
  }
}
