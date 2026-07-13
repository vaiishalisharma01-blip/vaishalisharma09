"use client";

import { AppLayout } from "@/components/layout/sidebar";
import {
  Avatar,
  Button,
  EmptyState,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui";
import { cn, formatDate, PROJECT_COLORS } from "@/lib/utils";
import type { Project, Task, TimeLog, User } from "@/types";
import { Clock, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface TimeLogWithRelations extends TimeLog {
  user?: User;
  task?: Task & { project?: { id: string; name: string; color: string } };
}

export default function TimeLogsPage() {
  const [timeLogs, setTimeLogs] = useState<TimeLogWithRelations[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    taskId: "",
    userId: "",
    hours: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const fetchTimeLogs = useCallback(async () => {
    const params = new URLSearchParams();
    if (projectFilter) params.set("projectId", projectFilter);
    const res = await fetch(`/api/timelogs?${params}`);
    if (res.ok) setTimeLogs(await res.json());
    setLoading(false);
  }, [projectFilter]);

  useEffect(() => {
    fetchTimeLogs();
  }, [fetchTimeLogs]);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([projectsData, tasksData, usersData]) => {
      setProjects(projectsData);
      setTasks(tasksData);
      setUsers(usersData);
      if (tasksData.length > 0) {
        setForm((f) => ({ ...f, taskId: tasksData[0].id }));
      }
      if (usersData.length > 0) {
        setForm((f) => ({ ...f, userId: usersData[0].id }));
      }
    });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/timelogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: form.taskId,
          userId: form.userId,
          hours: parseFloat(form.hours),
          description: form.description || null,
          date: form.date,
        }),
      });
      if (res.ok) {
        setModalOpen(false);
        setForm({
          taskId: tasks[0]?.id ?? "",
          userId: users[0]?.id ?? "",
          hours: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
        });
        fetchTimeLogs();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);

  const filteredTasks = projectFilter
    ? tasks.filter((t) => t.projectId === projectFilter)
    : tasks;

  return (
    <AppLayout
      title="Time Logs"
      subtitle={`${totalHours.toFixed(1)} hours logged total`}
      actions={
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Log Time
        </Button>
      }
    >
      <div className="mb-6">
        <Select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="w-64"
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-slate-200"
            />
          ))}
        </div>
      ) : timeLogs.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-6 w-6" />}
          title="No time logs found"
          description="Start tracking time on your tasks"
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Log Time
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Date
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  User
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Task
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Project
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">
                  Hours
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {timeLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 text-slate-700">
                    {formatDate(log.date)}
                  </td>
                  <td className="px-4 py-3">
                    {log.user && (
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={log.user.avatar}
                          name={log.user.name}
                          size="sm"
                        />
                        <span className="text-slate-700">{log.user.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {log.task?.title ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {log.task?.project && (
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            PROJECT_COLORS[log.task.project.color] ??
                              "bg-blue-500"
                          )}
                        />
                        <span className="text-slate-700">
                          {log.task.project.name}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    {log.hours}h
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-500">
                    {log.description ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Log Time"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                submitting ||
                !form.taskId ||
                !form.userId ||
                !form.hours ||
                parseFloat(form.hours) <= 0
              }
            >
              {submitting ? "Saving..." : "Log Time"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Task"
            value={form.taskId}
            onChange={(e) => setForm({ ...form, taskId: e.target.value })}
            required
          >
            {filteredTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </Select>
          <Select
            label="User"
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
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
              label="Hours"
              type="number"
              step="0.25"
              min="0.25"
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
              placeholder="e.g. 2.5"
              required
            />
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="What did you work on?"
            rows={3}
          />
        </form>
      </Modal>
    </AppLayout>
  );
}
