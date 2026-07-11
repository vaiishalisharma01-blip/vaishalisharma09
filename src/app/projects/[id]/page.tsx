"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/sidebar";
import { Badge, Button, Avatar, StatCard } from "@/components/ui";
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  Flag,
  Users,
  Clock,
} from "lucide-react";
import { STATUS_COLORS, PRIORITY_COLORS, formatDate, formatDueDate, isOverdue } from "@/lib/utils";
import type { Project, Task, Milestone } from "@/types";

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then((r) => r.json())
      .then(setProject)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <AppLayout title="Loading..." subtitle="">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout title="Project Not Found" subtitle="">
        <Link href="/projects" className="text-[#2563eb] hover:underline flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Link>
      </AppLayout>
    );
  }

  const tasks = (project.tasks ?? []) as Task[];
  const milestones = (project.milestones ?? []) as Milestone[];
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    review: tasks.filter((t) => t.status === "review"),
    done: tasks.filter((t) => t.status === "done"),
  };

  return (
    <AppLayout title={project.name} subtitle={project.description ?? undefined}>
      <div className="space-y-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#2563eb]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Link>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div
              className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: project.color }}
            >
              {project.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={STATUS_COLORS[project.status] ?? ""}>
                  {project.status.replace("_", " ")}
                </Badge>
                <Badge className={PRIORITY_COLORS[project.priority] ?? ""}>
                  {project.priority}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-6 text-sm text-gray-500">
                {project.startDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDate(project.startDate)} — {formatDate(project.endDate)}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {project.members?.length ?? 0} members
                </span>
              </div>
            </div>
            <Link href={`/tasks?projectId=${project.id}`}>
              <Button variant="secondary">View Kanban Board</Button>
            </Link>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Overall Progress</span>
              <span className="font-medium">{progress}% ({doneTasks}/{tasks.length} tasks)</span>
            </div>
            <div className="h-3 rounded-full bg-gray-100">
              <div
                className="h-3 rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: project.color }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Tasks" value={tasks.length} icon={<CheckSquare className="h-5 w-5" />} color="bg-blue-500" />
          <StatCard title="Completed" value={doneTasks} icon={<CheckSquare className="h-5 w-5" />} color="bg-emerald-500" />
          <StatCard title="Milestones" value={milestones.length} icon={<Flag className="h-5 w-5" />} color="bg-purple-500" />
          <StatCard title="In Progress" value={tasksByStatus.in_progress.length} icon={<Clock className="h-5 w-5" />} color="bg-orange-500" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Tasks</h2>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-6 py-3">
                  <Badge className={STATUS_COLORS[task.status] ?? ""}>
                    {task.status.replace("_", " ")}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{task.title}</div>
                  </div>
                  {task.assignee && (
                    <Avatar name={task.assignee.name} avatar={task.assignee.avatar} size="sm" />
                  )}
                  <span className={`text-xs ${isOverdue(task.dueDate) ? "text-red-600" : "text-gray-400"}`}>
                    {formatDueDate(task.dueDate)}
                  </span>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-gray-500">No tasks yet</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Milestones</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center gap-3 px-6 py-4">
                  <Flag className={`h-4 w-4 ${milestone.status === "completed" ? "text-emerald-500" : "text-gray-400"}`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{milestone.name}</div>
                    <div className="text-xs text-gray-500">
                      {milestone._count?.tasks ?? 0} tasks · Due {formatDate(milestone.dueDate)}
                    </div>
                  </div>
                  <Badge className={STATUS_COLORS[milestone.status] ?? ""}>{milestone.status}</Badge>
                </div>
              ))}
              {milestones.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-gray-500">No milestones yet</div>
              )}
            </div>
          </div>
        </div>

        {project.members && project.members.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Team Members</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {project.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                  <Avatar name={member.user?.name ?? ""} avatar={member.user?.avatar} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{member.user?.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{member.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
