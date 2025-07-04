import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import bcrypt from "bcryptjs"

// Schema for updating user
const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "LECTURER", "STUDENT"]).optional(),
  matricNumber: z.string().optional(),
  staffId: z.string().optional(),
  department: z.string().optional(),
  faculty: z.string().optional(),
  fingerprintId: z.string().optional(),
  rfidUid: z.string().optional(),
})

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Users can only view their own profile, unless they're an admin
    if (session.user.id !== params.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: {
        id: params.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        matricNumber: true,
        staffId: true,
        department: true,
        faculty: true,
        fingerprintId: true,
        rfidUid: true,
        createdAt: true,
        updatedAt: true,
        password: false, // Exclude password
        enrolledCourses: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                title: true,
                lecturer: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        taughtCourses: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Users can only update their own profile, unless they're an admin
    if (session.user.id !== params.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()

    // Validate request body
    const validatedData = updateUserSchema.parse(body)

    // If updating email, check if it's already taken
    if (validatedData.email) {
      const existingUser = await prisma.user.findUnique({
        where: {
          email: validatedData.email,
          NOT: {
            id: params.id,
          },
        },
      })

      if (existingUser) {
        return NextResponse.json({ success: false, message: "Email is already taken by another user" }, { status: 400 })
      }
    }

    // If updating matricNumber, check if it's already taken
    if (validatedData.matricNumber) {
      const existingMatric = await prisma.user.findUnique({
        where: {
          matricNumber: validatedData.matricNumber,
          NOT: {
            id: params.id,
          },
        },
      })

      if (existingMatric) {
        return NextResponse.json(
          { success: false, message: "Matric number is already taken by another user" },
          { status: 400 },
        )
      }
    }

    // If updating staffId, check if it's already taken
    if (validatedData.staffId) {
      const existingStaff = await prisma.user.findUnique({
        where: {
          staffId: validatedData.staffId,
          NOT: {
            id: params.id,
          },
        },
      })

      if (existingStaff) {
        return NextResponse.json(
          { success: false, message: "Staff ID is already taken by another user" },
          { status: 400 },
        )
      }
    }

    // If updating password, hash it
    const dataToUpdate = { ...validatedData }
    if (validatedData.password) {
      dataToUpdate.password = await bcrypt.hash(validatedData.password, 10)
    }

    // Update the user
    const user = await prisma.user.update({
      where: {
        id: params.id,
      },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        matricNumber: true,
        staffId: true,
        department: true,
        faculty: true,
        fingerprintId: true,
        rfidUid: true,
        createdAt: true,
        updatedAt: true,
        password: false, // Exclude password
      },
    })

    // Check that the session user exists before creating the audit log
    const actingUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!actingUser) {
      console.error("Session user not found in database:", session.user.id);
      return NextResponse.json({ success: false, message: "Session user not found in database" }, { status: 500 });
    }

    // Log the user update
    await prisma.auditLog.create({
      data: {
        action: "USER_UPDATED",
        details: `User ${user.name} updated`,
        userId: session.user.id,
        entity: "User",
      },
    })

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user,
    })
  } catch (error) {
    console.error("Error updating user:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid request data", errors: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, message: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Only admins can delete users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Delete the user
    await prisma.user.delete({
      where: {
        id: params.id,
      },
    })

    // Log the user deletion
    await prisma.auditLog.create({
      data: {
        action: "USER_DELETED",
        details: `User ${user.name} deleted`,
        userId: session.user.id,
        entity: "User",
      },
    })

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ success: false, message: "Failed to delete user" }, { status: 500 })
  }
}
