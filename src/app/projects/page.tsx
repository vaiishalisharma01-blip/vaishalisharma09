"use client";

import { AppLayout } from "@/components/layout/sidebar";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui";
import {
  cn,
  formatDate,
  PROJECT_COLORS,
  STATUS_COLORS,
} from "@/lib/utils";
import type { Project, User } from "@/types";
import { PROJECT_STATUSES } from "@/types";
import { FolderKanban, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const COLOR_OPTIONS = Object.keys(PROJECT_COLORS);

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "active",
    color: "blue",
    ownerId: "",
    startDate: "",
    endDate: "",
  });

  const fetchProjects = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/projects?${params}`);
    if (res.ok) {
      const data = await res.json();
      setProjects(data);
    }
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data);
        if (data.length > 0) {
          setForm((f) => ({ ...f, ownerId: data[0].id }));
        }
      });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          status: form.status,
          color: form.color,
          ownerId: form.ownerId,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        }),
      });
      if (res.ok) {
        setModalOpen(false);
        setForm({
          name: "",
          description: "",
          status: "active",
          color: "blue",
          ownerId: users[0]?.id ?? "",
          startDate: "",
          endDate: "",
        });
        fetchProjects();
      }
    } finally {
      setSubmitting(false);
    }
  }

  function formatStatusLabel(status: string) {
    return status.replace(/_/g, " ");
  }

  return (
    <AppLayout
      title="Projects"
      subtitle="Manage and track all your projects"
      actions={
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        >
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {formatStatusLabel(s)}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-lg bg-slate-200"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title="No projects found"
          description="Create your first project to get started"
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className={cn(
                  "h-1.5 rounded-t-lg",
                  PROJECT_COLORS[project.color] ?? "bg-blue-500"
                )}
              />
              <div className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-semibold text-slate-900 group-hover:text-[#2563eb]">
                    {project.name}
                  </h3>
                  <Badge
                    className={cn(
                      STATUS_COLORS[project.status] ??
                        "bg-slate-100 text-slate-700"
                    )}
                  >
                    {formatStatusLabel(project.status)}
                  </Badge>
                </div>
                {project.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-slate-500">
                    {project.description}
                  </p>
                )}
                <div className="mb-4">
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#2563eb]"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {project._count?.tasks ?? 0} tasks ·{" "}
                    {project._count?.members ?? 0} members
                  </span>
                  {project.endDate && (
                    <span>Due {formatDate(project.endDate)}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Project"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting || !form.name}>
              {submitting ? "Creating..." : "Create Project"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Project Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter project name"
            required
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the project"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {formatStatusLabel(s)}
                </option>
              ))}
            </Select>
            <Select
              label="Color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            >
              {COLOR_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </Select>
          </div>
          <Select
            label="Owner"
            value={form.ownerId}
            onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
            required
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
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
        </form>
      </Modal>
    </AppLayout>
  );
}
