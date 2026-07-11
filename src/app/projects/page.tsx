"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/sidebar";
import {
  Badge,
  Button,
  Modal,
  Input,
  Select,
  Textarea,
  EmptyState,
  Avatar,
} from "@/components/ui";
import { Plus, Calendar, Users } from "lucide-react";
import { STATUS_COLORS, PRIORITY_COLORS, PROJECT_COLORS, formatDate } from "@/lib/utils";
import { PROJECT_STATUSES, PRIORITIES } from "@/types";
import type { Project, User } from "@/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "active",
    priority: "medium",
    color: PROJECT_COLORS[0],
    startDate: "",
    endDate: "",
    ownerId: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([projectsData, usersData]) => {
      setProjects(projectsData);
      setUsers(usersData);
      if (usersData.length > 0) {
        setForm((f) => ({ ...f, ownerId: usersData[0].id }));
      }
      setLoading(false);
    });
  }, []);

  const filtered = filter === "all" ? projects : projects.filter((p) => p.status === filter);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const project = await res.json();
    setProjects([project, ...projects]);
    setShowModal(false);
    setForm({
      name: "",
      description: "",
      status: "active",
      priority: "medium",
      color: PROJECT_COLORS[0],
      startDate: "",
      endDate: "",
      ownerId: users[0]?.id ?? "",
    });
  }

  return (
    <AppLayout title="Projects" subtitle="Manage and track all your projects">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {["all", "active", "on_hold", "completed"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors capitalize ${
                  filter === status
                    ? "bg-[#2563eb] text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {status === "all" ? "All" : status.replace("_", " ")}
              </button>
            ))}
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No projects found"
            description="Create a new project to start organizing your team's work."
            action={
              <Button onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-11 w-11 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: project.color }}
                  >
                    {project.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-[#2563eb] transition-colors truncate">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                      {project.description || "No description"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className={STATUS_COLORS[project.status] ?? ""}>
                    {project.status.replace("_", " ")}
                  </Badge>
                  <Badge className={PRIORITY_COLORS[project.priority] ?? ""}>
                    {project.priority}
                  </Badge>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {project._count?.members ?? 0}
                    </span>
                    <span>{project._count?.tasks ?? 0} tasks</span>
                  </div>
                  {project.endDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(project.endDate)}
                    </span>
                  )}
                </div>

                {project.members && project.members.length > 0 && (
                  <div className="mt-3 flex -space-x-2">
                    {project.members.slice(0, 4).map((member) => (
                      <Avatar
                        key={member.id}
                        name={member.user?.name ?? ""}
                        avatar={member.user?.avatar}
                        size="sm"
                      />
                    ))}
                    {(project._count?.members ?? 0) > 4 && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-600">
                        +{(project._count?.members ?? 0) - 4}
                      </div>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create New Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Project Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter project name"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the project goals..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              options={PROJECT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
            <Select
              label="Priority"
              options={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    form.color === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <Select
            label="Project Owner"
            options={users.map((u) => ({ value: u.id, label: u.name }))}
            value={form.ownerId}
            onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
