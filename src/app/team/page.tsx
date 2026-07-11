"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/sidebar";
import {
  Badge,
  Button,
  Modal,
  Input,
  Select,
  Avatar,
  EmptyState,
} from "@/components/ui";
import { Plus, Mail, CheckSquare, FolderKanban } from "lucide-react";
import type { User } from "@/types";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  manager: "bg-purple-100 text-purple-700",
  member: "bg-blue-100 text-blue-700",
};

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "member",
  });

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const user = await res.json();
    setUsers([...users, user]);
    setShowModal(false);
    setForm({ name: "", email: "", role: "member" });
  }

  return (
    <AppLayout title="Team" subtitle="Manage team members and roles">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title="No team members"
            description="Add team members to collaborate on projects."
            action={
              <Button onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4" />
                Add Member
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <Avatar name={user.name} avatar={user.avatar} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                      <Mail className="h-3.5 w-3.5" />
                      {user.email}
                    </div>
                    <Badge className={`mt-2 ${ROLE_COLORS[user.role] ?? ""}`}>
                      {user.role}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400">
                      <CheckSquare className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {(user as User & { _count?: { assignedTasks: number } })._count?.assignedTasks ?? 0}
                    </div>
                    <div className="text-xs text-gray-500">Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400">
                      <FolderKanban className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {(user as User & { _count?: { projectMembers: number } })._count?.projectMembers ?? 0}
                    </div>
                    <div className="text-xs text-gray-500">Projects</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Team Member">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Full Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="John Doe"
          />
          <Input
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="john@company.com"
          />
          <Select
            label="Role"
            options={[
              { value: "member", label: "Member" },
              { value: "manager", label: "Manager" },
              { value: "admin", label: "Admin" },
            ]}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Member</Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
