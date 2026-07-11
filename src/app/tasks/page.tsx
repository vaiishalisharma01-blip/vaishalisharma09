"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AppLayout } from "@/components/layout/sidebar";
import {
  Badge,
  Button,
  Modal,
  Input,
  Select,
  Textarea,
  Avatar,
} from "@/components/ui";
import { Plus, GripVertical, MessageSquare, Clock } from "lucide-react";
import { PRIORITY_COLORS, formatDueDate, isOverdue } from "@/lib/utils";
import { TASK_STATUSES, PRIORITIES } from "@/types";
import type { Task, Project, User } from "@/types";

function SortableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow cursor-default"
    >
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{task.title}</p>
          {task.project && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{task.project.name}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className={PRIORITY_COLORS[task.priority] ?? ""}>{task.priority}</Badge>
            {task.dueDate && (
              <span className={`text-xs ${isOverdue(task.dueDate) ? "text-red-600 font-medium" : "text-gray-400"}`}>
                {formatDueDate(task.dueDate)}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between">
            {task.assignee ? (
              <Avatar name={task.assignee.name} avatar={task.assignee.avatar} size="sm" />
            ) : (
              <span className="text-xs text-gray-300">Unassigned</span>
            )}
            <div className="flex items-center gap-2 text-gray-400">
              {task._count?.comments ? (
                <span className="flex items-center gap-0.5 text-xs">
                  <MessageSquare className="h-3 w-3" /> {task._count.comments}
                </span>
              ) : null}
              {task._count?.timeLogs ? (
                <span className="flex items-center gap-0.5 text-xs">
                  <Clock className="h-3 w-3" /> {task._count.timeLogs}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <p className="text-sm font-medium text-gray-900">{task.title}</p>
      <Badge className={`mt-2 ${PRIORITY_COLORS[task.priority] ?? ""}`}>{task.priority}</Badge>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f4f6f9] pl-64 pt-16 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading tasks...</div>
      </div>
    }>
      <TasksPageContent />
    </Suspense>
  );
}

function TasksPageContent() {
  const searchParams = useSearchParams();
  const projectFilter = searchParams.get("projectId");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(projectFilter ?? "all");
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    projectId: "",
    assigneeId: "",
    dueDate: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const loadTasks = useCallback(async () => {
    const url = selectedProject !== "all"
      ? `/api/tasks?projectId=${selectedProject}`
      : "/api/tasks";
    const res = await fetch(url);
    const data = await res.json();
    setTasks(data);
    setLoading(false);
  }, [selectedProject]);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([projectsData, usersData]) => {
      setProjects(projectsData);
      setUsers(usersData);
      if (projectsData.length > 0 && !form.projectId) {
        setForm((f) => ({
          ...f,
          projectId: projectFilter ?? projectsData[0].id,
        }));
      }
    });
    loadTasks();
  }, [loadTasks, projectFilter, form.projectId]);

  useEffect(() => {
    if (projectFilter) setSelectedProject(projectFilter);
  }, [projectFilter]);

  function getTasksByStatus(status: string) {
    return tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let newStatus = task.status;
    const overData = over.data.current;

    if (overData?.sortable?.containerId) {
      newStatus = overData.sortable.containerId as string;
    } else if (TASK_STATUSES.some((s) => s.value === over.id)) {
      newStatus = over.id as string;
    } else {
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) newStatus = overTask.status;
    }

    if (newStatus === task.status && over.id === taskId) return;

    const columnTasks = getTasksByStatus(newStatus).filter((t) => t.id !== taskId);
    const overIndex = columnTasks.findIndex((t) => t.id === over.id);
    const insertIndex = overIndex >= 0 ? overIndex : columnTasks.length;

    columnTasks.splice(insertIndex, 0, { ...task, status: newStatus });

    const updates = columnTasks.map((t, i) => ({
      id: t.id,
      status: newStatus,
      position: i,
    }));

    setTasks((prev) => {
      const others = prev.filter((t) => t.status !== newStatus || t.id === taskId);
      const updated = columnTasks.map((t, i) => ({ ...t, status: newStatus, position: i }));
      const remaining = others.filter((t) => t.status !== newStatus);
      if (task.status !== newStatus) {
        const oldColumn = prev
          .filter((t) => t.status === task.status && t.id !== taskId)
          .map((t, i) => ({ ...t, position: i }));
        return [...remaining, ...updated, ...oldColumn];
      }
      return [...remaining.filter((t) => !updated.find((u) => u.id === t.id)), ...updated];
    });

    await fetch("/api/tasks/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks: updates }),
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        assigneeId: form.assigneeId || null,
        reporterId: users[0]?.id,
      }),
    });
    const task = await res.json();
    setTasks([...tasks, task]);
    setShowModal(false);
    setForm({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      projectId: form.projectId,
      assigneeId: "",
      dueDate: "",
    });
  }

  return (
    <AppLayout title="Tasks" subtitle="Kanban board for task management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Select
            options={[
              { value: "all", label: "All Projects" },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              setLoading(true);
            }}
            className="w-64"
          />
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={(e: DragStartEvent) => {
              const task = tasks.find((t) => t.id === e.active.id);
              setActiveTask(task ?? null);
            }}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {TASK_STATUSES.map((column) => {
                const columnTasks = getTasksByStatus(column.value);
                return (
                  <div
                    key={column.value}
                    className={`rounded-xl border ${column.color} p-4 min-h-[500px]`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-800">{column.label}</h3>
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {columnTasks.length}
                      </span>
                    </div>
                    <SortableContext
                      id={column.value}
                      items={columnTasks.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {columnTasks.map((task) => (
                          <SortableTask key={task.id} task={task} />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                );
              })}
            </div>
            <DragOverlay>
              {activeTask ? <TaskCard task={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create New Task">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Task Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Enter task title"
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
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              options={TASK_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
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
          <Select
            label="Assignee"
            options={[
              { value: "", label: "Unassigned" },
              ...users.map((u) => ({ value: u.id, label: u.name })),
            ]}
            value={form.assigneeId}
            onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
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
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
