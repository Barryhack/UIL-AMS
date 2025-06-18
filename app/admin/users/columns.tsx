"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

export type User = {
  id: string
  name: string
  email: string
  role: string
  faculty: string | null
  department: string | null
  createdAt: Date
  updatedAt: Date
  matricNumber?: string | null
  staffId?: string | null
}

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "faculty",
    header: "Faculty",
  },
  {
    accessorKey: "department",
    header: "Department",
  },
  {
    accessorKey: "matricNumber",
    header: "Matric Number",
  },
  {
    accessorKey: "staffId",
    header: "Staff ID",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      return format(new Date(row.getValue("createdAt")), "PPP")
    },
  },
] 