"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/sidebar";
import {
  Badge,
  Button,
  Modal,
  Input,
  Select,
  Textarea,
  EmptyState,
} from "@/components/ui";
import { Plus, Flag, Calendar } from "lucide-react";
import { STATUS_COLORS, formatDate } from "@/lib/utils";
import type { Milestone, Project } from "@/types";

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    name: "",
    description: "",
    projectId: "",
    dueDate: "",
    status: "open",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/milestones").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ]).then(([milestonesData, projectsData]) => {
      setMilestones(milestonesData);
      setProjects(projectsData);
      if (projectsData.length > 0) {
        setForm((f) => ({ ...f, projectId: projectsData[0].id }));
      }
      setLoading(false);
    });
  }, []);

  const filtered =
    filter === "all"
      ? milestones
      : milestones.filter((m) => m.projectId === filter);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/milestones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const milestone = await res.json();
    setMilestones([milestone, ...milestones]);
    setShowModal(false);
    setForm({
      name: "",
      description: "",
      projectId: form.projectId,
      dueDate: "",
      status: "open",
    });
  }

  async function toggleStatus(milestone: Milestone) {
    const newStatus = milestone.status === "open" ? "completed" : "open";
    const res = await fetch(`/api/milestones/${milestone.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const updated = await res.json();
    setMilestones(milestones.map((m) => (m.id === updated.id ? updated : m)));
  }

  return (
    <AppLayout title="Milestones" subtitle="Track project milestones and deliverables">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Select
            options={[
              { value: "all", label: "All Projects" },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-64"
          />
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            New Milestone
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No milestones yet"
            description="Create milestones to track key deliverables and deadlines."
            action={
              <Button onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4" />
                Create Milestone
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((milestone) => (
              <div
                key={milestone.id}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => toggleStatus(milestone)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                    milestone.status === "completed"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-600"
                  }`}
                >
                  <Flag className="h-5 w-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`font-semibold text-gray-900 ${
                        milestone.status === "completed" ? "line-through text-gray-400" : ""
                      }`}
                    >
                      {milestone.name}
                    </h3>
                    <Badge className={STATUS_COLORS[milestone.status] ?? ""}>
                      {milestone.status}
                    </Badge>
                  </div>
                  {milestone.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{milestone.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                      style={{
                        backgroundColor: milestone.project?.color
                          ? `${milestone.project.color}15`
                          : undefined,
                        color: milestone.project?.color ?? undefined,
                      }}
                    >
                      {milestone.project?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due {formatDate(milestone.dueDate)}
                    </span>
                    <span>{milestone._count?.tasks ?? 0} tasks</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Milestone">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Milestone Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Beta Release"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Select
            label="Project"
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
            value={form.projectId}
            onChange={(e) => setForm({ ...form, projectId: e.target.value })}
          />
          <Input
            label="Due Date"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Milestone</Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
