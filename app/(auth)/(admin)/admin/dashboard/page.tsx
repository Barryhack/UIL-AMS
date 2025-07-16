"use client"

export const dynamic = "force-dynamic";

import { Overview } from "@/components/admin/overview";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <Overview />
    </div>
  );
} 