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
  isOverdue,
  PROJECT_COLORS,
  STATUS_COLORS,
} from "@/lib/utils";
import type { Milestone, Project } from "@/types";
import { MILESTONE_STATUSES } from "@/types";
import { Flag, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    projectId: "",
    dueDate: "",
    status: "pending",
  });

  const fetchMilestones = useCallback(async () => {
    const params = new URLSearchParams();
    if (projectFilter) params.set("projectId", projectFilter);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/milestones?${params}`);
    if (res.ok) setMilestones(await res.json());
    setLoading(false);
  }, [projectFilter, statusFilter]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data: Project[]) => {
        setProjects(data);
        if (data.length > 0) {
          setForm((f) => ({ ...f, projectId: data[0].id }));
        }
      });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          projectId: form.projectId,
          dueDate: form.dueDate || null,
          status: form.status,
        }),
      });
      if (res.ok) {
        setModalOpen(false);
        setForm({
          title: "",
          description: "",
          projectId: projects[0]?.id ?? "",
          dueDate: "",
          status: "pending",
        });
        fetchMilestones();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusUpdate(id: string, status: string) {
    const res = await fetch(`/api/milestones/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchMilestones();
  }

  function formatStatusLabel(status: string) {
    return status.replace(/_/g, " ");
  }

  return (
    <AppLayout
      title="Milestones"
      subtitle="Track key deliverables and project phases"
      actions={
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          New Milestone
        </Button>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="w-48"
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        >
          <option value="">All statuses</option>
          {MILESTONE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {formatStatusLabel(s)}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-slate-200"
            />
          ))}
        </div>
      ) : milestones.length === 0 ? (
        <EmptyState
          icon={<Flag className="h-6 w-6" />}
          title="No milestones found"
          description="Create milestones to track key project deliverables"
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Milestone
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-1 h-3 w-3 shrink-0 rounded-full",
                      milestone.project
                        ? PROJECT_COLORS[milestone.project.color] ??
                            "bg-blue-500"
                        : "bg-blue-500"
                    )}
                  />
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {milestone.title}
                    </h3>
                    {milestone.description && (
                      <p className="mt-1 text-sm text-slate-500">
                        {milestone.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {milestone.project && (
                        <span>{milestone.project.name}</span>
                      )}
                      <span>{milestone._count?.tasks ?? 0} tasks</span>
                      {milestone.dueDate && (
                        <span
                          className={cn(
                            isOverdue(milestone.dueDate) &&
                              milestone.status !== "completed"
                              ? "text-red-600"
                              : ""
                          )}
                        >
                          Due {formatDate(milestone.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      STATUS_COLORS[milestone.status] ??
                        "bg-slate-100 text-slate-700"
                    )}
                  >
                    {formatStatusLabel(milestone.status)}
                  </Badge>
                  <Select
                    value={milestone.status}
                    onChange={(e) =>
                      handleStatusUpdate(milestone.id, e.target.value)
                    }
                    className="w-36"
                  >
                    {MILESTONE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {formatStatusLabel(s)}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              {milestone.tasks && milestone.tasks.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="mb-2 text-xs font-medium text-slate-500">
                    Linked Tasks
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {milestone.tasks.map((task) => (
                      <Badge
                        key={task.id}
                        className={cn(
                          STATUS_COLORS[task.status] ??
                            "bg-slate-100 text-slate-700"
                        )}
                      >
                        {task.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Milestone"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting || !form.title || !form.projectId}
            >
              {submitting ? "Creating..." : "Create Milestone"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Milestone title"
            required
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="Describe this milestone"
            rows={3}
          />
          <Select
            label="Project"
            value={form.projectId}
            onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            required
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Due Date"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {MILESTONE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {formatStatusLabel(s)}
                </option>
              ))}
            </Select>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
