import { AppLayout } from "@/components/layout/sidebar";
import { Avatar, Badge, StatCard } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import {
  cn,
  formatRelativeDate,
  isOverdue,
  PROJECT_COLORS,
  STATUS_COLORS,
} from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FolderKanban,
  ListTodo,
  Users,
} from "lucide-react";
import Link from "next/link";

async function getDashboardData() {
  const [
    totalProjects,
    activeProjects,
    totalTasks,
    completedTasks,
    allTasks,
    totalUsers,
    timeLogsAggregate,
    recentActivities,
    tasksGrouped,
    projectsGrouped,
    recentProjects,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: "active" } }),
    prisma.task.count(),
    prisma.task.count({ where: { status: "done" } }),
    prisma.task.findMany({
      where: { status: { not: "done" }, dueDate: { not: null } },
      select: { dueDate: true },
    }),
    prisma.user.count(),
    prisma.timeLog.aggregate({ _sum: { hours: true } }),
    prisma.activity.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        project: { select: { id: true, name: true, color: true } },
        task: { select: { id: true, title: true } },
      },
    }),
    prisma.task.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.project.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.project.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { tasks: true, members: true } },
      },
    }),
  ]);

  const overdueTasks = allTasks.filter((t) => isOverdue(t.dueDate)).length;

  const tasksByStatus: Record<string, number> = {};
  for (const group of tasksGrouped) {
    tasksByStatus[group.status] = group._count.status;
  }

  const projectsByStatus: Record<string, number> = {};
  for (const group of projectsGrouped) {
    projectsByStatus[group.status] = group._count.status;
  }

  return {
    totalProjects,
    activeProjects,
    totalTasks,
    completedTasks,
    overdueTasks,
    totalUsers,
    totalHoursLogged: timeLogsAggregate._sum.hours ?? 0,
    recentActivities,
    tasksByStatus,
    projectsByStatus,
    recentProjects,
  };
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export default async function DashboardPage() {
  const stats = await getDashboardData();
  const completionRate =
    stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Overview of your projects and team activity"
    >
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Projects"
            value={stats.totalProjects}
            subtitle={`${stats.activeProjects} active`}
            icon={<FolderKanban className="h-5 w-5" />}
          />
          <StatCard
            title="Total Tasks"
            value={stats.totalTasks}
            subtitle={`${stats.completedTasks} completed`}
            icon={<ListTodo className="h-5 w-5" />}
          />
          <StatCard
            title="Team Members"
            value={stats.totalUsers}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Hours Logged"
            value={stats.totalHoursLogged.toFixed(1)}
            subtitle="Total time tracked"
            icon={<Clock className="h-5 w-5" />}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              Task Completion
            </h2>
            <div className="flex items-center justify-center py-4">
              <div className="relative flex h-32 w-32 items-center justify-center">
                <svg className="h-32 w-32 -rotate-90 transform">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e2e8f0"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#2563eb"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(completionRate / 100) * 351.86} 351.86`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-2xl font-bold text-slate-900">
                  {completionRate}%
                </span>
              </div>
            </div>
            <div className="mt-2 space-y-2">
              {Object.entries(stats.tasksByStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between text-sm"
                >
                  <Badge className={cn(STATUS_COLORS[status] ?? "bg-slate-100 text-slate-700")}>
                    {formatStatusLabel(status)}
                  </Badge>
                  <span className="font-medium text-slate-700">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              Projects by Status
            </h2>
            <div className="space-y-3">
              {Object.entries(stats.projectsByStatus).map(([status, count]) => {
                const pct =
                  stats.totalProjects > 0
                    ? Math.round((count / stats.totalProjects) * 100)
                    : 0;
                return (
                  <div key={status}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="capitalize text-slate-600">
                        {formatStatusLabel(status)}
                      </span>
                      <span className="font-medium text-slate-900">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#2563eb] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {stats.overdueTasks > 0 && (
              <div className="mt-6 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {stats.overdueTasks} overdue task
                {stats.overdueTasks !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              Recent Projects
            </h2>
            <div className="space-y-3">
              {stats.recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-slate-50"
                >
                  <div
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      PROJECT_COLORS[project.color] ?? "bg-blue-500"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {project.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {project._count.tasks} tasks · {project._count.members}{" "}
                      members
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      STATUS_COLORS[project.status] ?? "bg-slate-100 text-slate-700"
                    )}
                  >
                    {formatStatusLabel(project.status)}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Recent Activity
          </h2>
          {stats.recentActivities.length === 0 ? (
            <p className="text-sm text-slate-500">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {stats.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar
                    src={activity.user.avatar}
                    name={activity.user.name}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium text-slate-900">
                        {activity.user.name}
                      </span>{" "}
                      {activity.description}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatRelativeDate(activity.createdAt)}
                      {activity.project && (
                        <>
                          {" · "}
                          <span className="text-slate-500">
                            {activity.project.name}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-300" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
