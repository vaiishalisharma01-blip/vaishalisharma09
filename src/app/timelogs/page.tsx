"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/sidebar";
import {
  Button,
  Modal,
  Input,
  Select,
  Textarea,
  Avatar,
  EmptyState,
} from "@/components/ui";
import { Plus, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { TimeLog, Task, User, Project } from "@/types";

export default function TimeLogsPage() {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    hours: "",
    description: "",
    taskId: "",
    userId: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/timelogs").then((r) => r.json()),
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ]).then(([logsData, tasksData, usersData, projectsData]) => {
      setTimeLogs(logsData);
      setTasks(tasksData);
      setUsers(usersData);
      setProjects(projectsData);
      if (tasksData.length > 0) setForm((f) => ({ ...f, taskId: tasksData[0].id }));
      if (usersData.length > 0) setForm((f) => ({ ...f, userId: usersData[0].id }));
      setLoading(false);
    });
  }, []);

  const filtered =
    filter === "all"
      ? timeLogs
      : timeLogs.filter((log) => log.task?.projectId === filter);

  const totalHours = filtered.reduce((sum, log) => sum + log.hours, 0);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/timelogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        hours: parseFloat(form.hours),
      }),
    });
    const log = await res.json();
    setTimeLogs([log, ...timeLogs]);
    setShowModal(false);
    setForm({
      hours: "",
      description: "",
      taskId: form.taskId,
      userId: form.userId,
      date: new Date().toISOString().split("T")[0],
    });
  }

  return (
    <AppLayout title="Time Logs" subtitle="Track time spent on tasks and projects">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select
              options={[
                { value: "all", label: "All Projects" },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-64"
            />
            <div className="rounded-lg bg-[#2563eb]/10 px-4 py-2 text-sm">
              <span className="text-gray-600">Total: </span>
              <span className="font-bold text-[#2563eb]">{totalHours} hours</span>
            </div>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            Log Time
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No time logs yet"
            description="Start logging time to track how your team spends their hours."
            action={
              <Button onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4" />
                Log Time
              </Button>
            }
          />
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(log.date)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {log.user && (
                          <Avatar name={log.user.name} avatar={log.user.avatar} size="sm" />
                        )}
                        <span className="text-sm text-gray-900">{log.user?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{log.task?.title}</td>
                    <td className="px-6 py-4">
                      <span
                        className="text-xs font-medium rounded-full px-2 py-0.5"
                        style={{
                          backgroundColor: log.task?.project?.color
                            ? `${log.task.project.color}15`
                            : undefined,
                          color: log.task?.project?.color ?? undefined,
                        }}
                      >
                        {log.task?.project?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#2563eb]">
                        <Clock className="h-3.5 w-3.5" />
                        {log.hours}h
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {log.description || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Log Time">
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Task"
            options={tasks.map((t) => ({
              value: t.id,
              label: `${t.title} (${t.project?.name ?? "Unknown"})`,
            }))}
            value={form.taskId}
            onChange={(e) => setForm({ ...form, taskId: e.target.value })}
          />
          <Select
            label="Team Member"
            options={users.map((u) => ({ value: u.id, label: u.name }))}
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hours"
              type="number"
              step="0.5"
              min="0.5"
              required
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
              placeholder="e.g., 2.5"
            />
            <Input
              label="Date"
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What did you work on?"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Log Time</Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
