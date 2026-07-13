"use client";

import { AppLayout } from "@/components/layout/sidebar";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  Modal,
  Select,
} from "@/components/ui";
import {
  cn,
  formatDueDate,
  isOverdue,
  PRIORITY_COLORS,
  STATUS_COLORS,
} from "@/lib/utils";
import type { Project, Task, TaskStatus } from "@/types";
import { TASK_STATUSES } from "@/types";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ListTodo, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

const COLUMN_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  todo: { label: "To Do", color: "border-t-slate-400" },
  in_progress: { label: "In Progress", color: "border-t-blue-500" },
  review: { label: "Review", color: "border-t-amber-500" },
  done: { label: "Done", color: "border-t-emerald-500" },
};

function TaskCard({
  task,
  isDragging,
}: {
  task: Task;
  isDragging?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-md border border-slate-200 bg-white p-3 shadow-sm",
        (isDragging || isSortableDragging) && "opacity-50 shadow-lg"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900">{task.title}</p>
          {task.project && (
            <p className="mt-0.5 text-xs text-slate-500">{task.project.name}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge
              className={cn(
                PRIORITY_COLORS[task.priority] ?? "bg-slate-100 text-slate-700"
              )}
            >
              {task.priority}
            </Badge>
            {task.dueDate && (
              <span
                className={cn(
                  "text-xs",
                  isOverdue(task.dueDate) ? "text-red-600" : "text-slate-500"
                )}
              >
                {formatDueDate(task.dueDate)}
              </span>
            )}
          </div>
          {task.assignee && (
            <div className="mt-2 flex items-center gap-1.5">
              <Avatar
                src={task.assignee.avatar}
                name={task.assignee.name}
                size="sm"
              />
              <span className="text-xs text-slate-500">
                {task.assignee.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  tasks,
}: {
  status: string;
  tasks: Task[];
}) {
  const config = COLUMN_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border border-slate-200 bg-slate-50",
        config.color,
        "border-t-4"
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">
          {config.label}
        </h3>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 overflow-y-auto px-3 pb-3 min-h-[200px]",
          isOver && "bg-blue-50/50"
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function TasksKanbanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdFilter = searchParams.get("projectId") ?? "";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    projectId: projectIdFilter,
    priority: "medium",
    status: "todo",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const fetchTasks = useCallback(async () => {
    const params = new URLSearchParams();
    if (projectIdFilter) params.set("projectId", projectIdFilter);
    const res = await fetch(`/api/tasks?${params}`);
    if (res.ok) setTasks(await res.json());
    setLoading(false);
  }, [projectIdFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data: Project[]) => {
        setProjects(data);
        if (data.length > 0) {
          setForm((f) => ({
            ...f,
            projectId: projectIdFilter || f.projectId || data[0].id,
          }));
        }
      });
  }, [projectIdFilter]);

  function getTasksByStatus(status: string) {
    return tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.order - b.order);
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let newStatus: TaskStatus = task.status;
    let newOrder = task.order;

    if (TASK_STATUSES.includes(over.id as TaskStatus)) {
      newStatus = over.id as TaskStatus;
      const columnTasks = getTasksByStatus(newStatus).filter(
        (t) => t.id !== taskId
      );
      newOrder = columnTasks.length;
    } else {
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) {
        newStatus = overTask.status;
        const columnTasks = getTasksByStatus(newStatus).filter(
          (t) => t.id !== taskId
        );
        const overIndex = columnTasks.findIndex((t) => t.id === over.id);
        newOrder = overIndex >= 0 ? overIndex : columnTasks.length;
      }
    }

    if (newStatus === task.status && newOrder === task.order) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, order: newOrder } : t
      )
    );

    await fetch("/api/tasks/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tasks: [{ id: taskId, order: newOrder, status: newStatus }],
      }),
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setModalOpen(false);
        setForm({
          title: "",
          projectId: projectIdFilter || projects[0]?.id || "",
          priority: "medium",
          status: "todo",
        });
        fetchTasks();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const selectedProject = projects.find((p) => p.id === projectIdFilter);

  return (
    <AppLayout
      title="Tasks"
      subtitle={
        selectedProject
          ? `Kanban board for ${selectedProject.name}`
          : "Drag and drop tasks across columns"
      }
      actions={
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      }
    >
      <div className="mb-6">
        <Select
          value={projectIdFilter}
          onChange={(e) => {
            const params = new URLSearchParams();
            if (e.target.value) params.set("projectId", e.target.value);
            router.push(`/tasks${params.toString() ? `?${params}` : ""}`);
          }}
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
        <div className="flex gap-4 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-96 w-72 shrink-0 animate-pulse rounded-lg bg-slate-200"
            />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<ListTodo className="h-6 w-6" />}
          title="No tasks found"
          description="Create a task to populate the Kanban board"
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {TASK_STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={getTasksByStatus(status)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? (
              <TaskCard task={activeTask} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Task"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting || !form.title || !form.projectId}
            >
              {submitting ? "Creating..." : "Create Task"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
            placeholder="Task title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
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
            <Select
              label="Priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

function TasksKanbanFallback() {
  return (
    <AppLayout title="Tasks" subtitle="Loading Kanban board...">
      <div className="flex gap-4 overflow-x-auto">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-96 w-72 shrink-0 animate-pulse rounded-lg bg-slate-200"
          />
        ))}
      </div>
    </AppLayout>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<TasksKanbanFallback />}>
      <TasksKanbanContent />
    </Suspense>
  );
}
