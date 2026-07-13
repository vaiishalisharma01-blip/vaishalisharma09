"use client";

import { AppLayout } from "@/components/layout/sidebar";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  Select,
  StatCard,
} from "@/components/ui";
import {
  cn,
  formatDate,
  formatDueDate,
  isOverdue,
  PRIORITY_COLORS,
  PROJECT_COLORS,
  STATUS_COLORS,
} from "@/lib/utils";
import type { Task } from "@/types";
import { PROJECT_STATUSES } from "@/types";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Flag,
  ListTodo,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  status: string;
  color: string;
  ownerId: string;
  startDate: string | null;
  endDate: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role?: string;
  };
  tasks: Task[];
  milestones: Array<{
    id: string;
    title: string;
    status: string;
    dueDate: string | null;
    _count: { tasks: number };
  }>;
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
      role: string;
    };
  }>;
  _count?: {
    tasks: number;
    members: number;
    milestones: number;
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) {
      setProject(await res.json());
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  async function handleStatusChange(status: string) {
    if (!project) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setProject(await res.json());
      }
    } finally {
      setUpdating(false);
    }
  }

  function formatStatusLabel(status: string) {
    return status.replace(/_/g, " ");
  }

  if (loading) {
    return (
      <AppLayout title="Loading..." subtitle="">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-slate-200" />
          <div className="h-48 rounded-lg bg-slate-200" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout title="Project Not Found" subtitle="">
        <EmptyState
          title="Project not found"
          description="This project may have been deleted or does not exist."
          action={
            <Link href="/projects">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Back to Projects
              </Button>
            </Link>
          }
        />
      </AppLayout>
    );
  }

  const tasksByStatus = project.tasks.reduce(
    (acc, task) => {
      acc[task.status] = (acc[task.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <AppLayout
      title={project.name}
      subtitle={project.description ?? undefined}
      actions={
        <div className="flex items-center gap-3">
          <Link href="/projects">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <Select
            value={project.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updating}
            className="w-36"
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatStatusLabel(s)}
              </option>
            ))}
          </Select>
        </div>
      }
    >
      <div className="space-y-6">
        <div
          className={cn(
            "h-1 rounded-full",
            PROJECT_COLORS[project.color] ?? "bg-blue-500"
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Tasks"
            value={project._count?.tasks ?? project.tasks.length}
            icon={<ListTodo className="h-5 w-5" />}
          />
          <StatCard
            title="Members"
            value={project._count?.members ?? project.members.length}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Milestones"
            value={project._count?.milestones ?? project.milestones.length}
            icon={<Flag className="h-5 w-5" />}
          />
          <StatCard
            title="Progress"
            value={`${project.progress}%`}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Tasks</h2>
              <Link href={`/tasks?projectId=${project.id}`}>
                <Button variant="ghost" size="sm">
                  View Kanban
                </Button>
              </Link>
            </div>
            {project.tasks.length === 0 ? (
              <p className="text-sm text-slate-500">No tasks yet</p>
            ) : (
              <div className="space-y-2">
                {project.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-md border border-slate-100 p-3 hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {task.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge
                          className={cn(
                            STATUS_COLORS[task.status] ??
                              "bg-slate-100 text-slate-700"
                          )}
                        >
                          {formatStatusLabel(task.status)}
                        </Badge>
                        <Badge
                          className={cn(
                            PRIORITY_COLORS[task.priority] ??
                              "bg-slate-100 text-slate-700"
                          )}
                        >
                          {task.priority}
                        </Badge>
                        {task.dueDate && (
                          <span
                            className={cn(
                              "text-xs",
                              isOverdue(task.dueDate)
                                ? "text-red-600"
                                : "text-slate-500"
                            )}
                          >
                            {formatDueDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    {task.assignee && (
                      <Avatar
                        src={task.assignee.avatar}
                        name={task.assignee.name}
                        size="sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">
                Project Info
              </h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-slate-500">Owner</dt>
                  <dd className="mt-1 flex items-center gap-2 font-medium text-slate-900">
                    {project.owner && (
                      <>
                        <Avatar
                          src={project.owner.avatar}
                          name={project.owner.name}
                          size="sm"
                        />
                        {project.owner.name}
                      </>
                    )}
                  </dd>
                </div>
                {project.startDate && (
                  <div>
                    <dt className="text-slate-500">Start Date</dt>
                    <dd className="mt-1 flex items-center gap-1 font-medium text-slate-900">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(project.startDate)}
                    </dd>
                  </div>
                )}
                {project.endDate && (
                  <div>
                    <dt className="text-slate-500">End Date</dt>
                    <dd className="mt-1 flex items-center gap-1 font-medium text-slate-900">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(project.endDate)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-slate-500">Tasks by Status</dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(tasksByStatus).map(([status, count]) => (
                      <Badge
                        key={status}
                        className={cn(
                          STATUS_COLORS[status] ?? "bg-slate-100 text-slate-700"
                        )}
                      >
                        {formatStatusLabel(status)}: {count}
                      </Badge>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">
                Team Members
              </h2>
              <div className="space-y-3">
                {project.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar
                      src={member.user.avatar}
                      name={member.user.name}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {member.user.name}
                      </p>
                      <p className="text-xs capitalize text-slate-500">
                        {member.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">
                Milestones
              </h2>
              {project.milestones.length === 0 ? (
                <p className="text-sm text-slate-500">No milestones</p>
              ) : (
                <div className="space-y-3">
                  {project.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="rounded-md border border-slate-100 p-3"
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-slate-900">
                          {milestone.title}
                        </p>
                        <Badge
                          className={cn(
                            STATUS_COLORS[milestone.status] ??
                              "bg-slate-100 text-slate-700"
                          )}
                        >
                          {formatStatusLabel(milestone.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {milestone._count.tasks} tasks
                        {milestone.dueDate &&
                          ` · Due ${formatDate(milestone.dueDate)}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
