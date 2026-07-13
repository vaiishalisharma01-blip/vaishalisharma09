"use client";

import { AppLayout } from "@/components/layout/sidebar";
import { Avatar, Badge, EmptyState, StatCard } from "@/components/ui";
import type { User } from "@/types";
import { Mail, Search, UserCheck, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface UserWithCounts extends User {
  _count?: {
    assignedTasks: number;
    projectMembers: number;
  };
}

export default function TeamPage() {
  const [users, setUsers] = useState<UserWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/users?${params}`);
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalTasks = users.reduce(
    (sum, u) => sum + (u._count?.assignedTasks ?? 0),
    0
  );

  const departments = [...new Set(users.map((u) => u.department).filter(Boolean))];

  return (
    <AppLayout
      title="Team"
      subtitle="View and manage team members across projects"
    >
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Team Members"
          value={users.length}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Assigned Tasks"
          value={totalTasks}
          icon={<UserCheck className="h-5 w-5" />}
        />
        <StatCard
          title="Departments"
          value={departments.length}
          subtitle={departments.join(", ") || "No departments"}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-lg bg-slate-200"
            />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No team members found"
          description="Try adjusting your search criteria"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Avatar src={user.avatar} name={user.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900">{user.name}</h3>
                  <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.jobTitle && (
                    <p className="mt-1 text-sm text-slate-600">
                      {user.jobTitle}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge className="bg-[#2563eb]/10 text-[#2563eb] capitalize">
                      {user.role}
                    </Badge>
                    {user.department && (
                      <Badge className="bg-slate-100 text-slate-600">
                        {user.department}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-900">
                    {user._count?.assignedTasks ?? 0}
                  </p>
                  <p className="text-xs text-slate-500">Assigned Tasks</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-900">
                    {user._count?.projectMembers ?? 0}
                  </p>
                  <p className="text-xs text-slate-500">Projects</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
