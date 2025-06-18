import { NextAuthOptions } from "next-auth"
import { DefaultSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import { compare } from "@/lib/password"

type UserRole = "ADMIN" | "LECTURER" | "STUDENT"

declare module "next-auth" {
  interface User {
    id: string
    name: string
    email: string
    role: UserRole
  }

  interface Session {
    user: {
      id: string
      role: UserRole
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error("Missing credentials")
            throw new Error("Missing credentials")
          }

          console.log("Attempting to find user:", credentials.email)
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user) {
            console.error("User not found:", credentials.email)
            throw new Error("Invalid credentials")
          }

          console.log("User found, comparing passwords")
          const isValid = await compare(credentials.password, user.password)

          if (!isValid) {
            console.error("Invalid password for user:", credentials.email)
            throw new Error("Invalid credentials")
          }

          console.log("Login successful for user:", credentials.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    }
  }
}
