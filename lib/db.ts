import { PrismaClient, Prisma } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma

// Test the database connection
prisma.$connect()
  .then(() => {
    console.log('Successfully connected to the database')
  })
  .catch((error: Error) => {
    console.error('Failed to connect to the database:', error)
  })

export async function executeQuery<T = unknown>(
  query: Prisma.Sql | TemplateStringsArray,
  ...values: any[]
): Promise<T> {
  try {
    const result = await prisma.$queryRaw<T>(query, ...values)
    return result
  } catch (error: any) {
    console.error("Error executing query:", error)
    throw new Error(`Failed to execute query: ${error.message}`)
  }
}
