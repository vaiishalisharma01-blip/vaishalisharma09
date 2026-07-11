import { AppLayout } from "@/components/layout/sidebar";
import { StatCard, Badge, Avatar } from "@/components/ui";
import {
  FolderKanban,
  CheckSquare,
  Clock,
  Users,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { formatRelativeDate, formatDueDate, isOverdue, STATUS_COLORS, PRIORITY_COLORS } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

async function getDashboardData() {
  const [
    totalProjects,
    activeProjects,
    totalTasks,
    completedTasks,
    overdueTasks,
    timeLogs,
    teamMembers,
    recentActivities,
    projects,
    upcomingTasks,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: "active" } }),
    prisma.task.count(),
    prisma.task.count({ where: { status: "done" } }),
    prisma.task.count({
      where: {
        status: { not: "done" },
        dueDate: { lt: new Date() },
      },
    }),
    prisma.timeLog.aggregate({ _sum: { hours: true } }),
    prisma.user.count(),
    prisma.activity.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: true, project: true },
    }),
    prisma.project.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { tasks: true, members: true } },
        members: { include: { user: true }, take: 3 },
      },
    }),
    prisma.task.findMany({
      where: { status: { not: "done" }, dueDate: { not: null } },
      orderBy: { dueDate: "asc" },
      take: 8,
      include: {
        assignee: true,
        project: true,
      },
    }),
  ]);

  return {
    stats: {
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      totalHours: timeLogs._sum.hours ?? 0,
      teamMembers,
    },
    recentActivities: recentActivities.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
    projects: projects.map((p) => ({
      ...p,
      startDate: p.startDate?.toISOString() ?? null,
      endDate: p.endDate?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    upcomingTasks: upcomingTasks.map((t) => ({
      ...t,
      dueDate: t.dueDate?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
  };
}

export default async function DashboardPage() {
  const { stats, recentActivities, projects, upcomingTasks } = await getDashboardData();

  const completionRate =
    stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

  return (
    <AppLayout title="Dashboard" subtitle="Overview of your projects and tasks">
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Projects"
            value={stats.activeProjects}
            icon={<FolderKanban className="h-5 w-5" />}
            trend={`${stats.totalProjects} total projects`}
            color="bg-[#2563eb]"
          />
          <StatCard
            title="Open Tasks"
            value={stats.totalTasks - stats.completedTasks}
            icon={<CheckSquare className="h-5 w-5" />}
            trend={`${completionRate}% completion rate`}
            color="bg-purple-500"
          />
          <StatCard
            title="Hours Logged"
            value={stats.totalHours}
            icon={<Clock className="h-5 w-5" />}
            trend="This month"
            color="bg-teal-500"
          />
          <StatCard
            title="Team Members"
            value={stats.teamMembers}
            icon={<Users className="h-5 w-5" />}
            trend={`${stats.overdueTasks} overdue tasks`}
            color="bg-orange-500"
          />
        </div>

        {stats.overdueTasks > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-sm text-red-700">
              You have <strong>{stats.overdueTasks}</strong> overdue task{stats.overdueTasks > 1 ? "s" : ""} that need attention.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 className="font-semibold text-gray-900">Recent Projects</h2>
                <Link href="/projects" className="text-sm text-[#2563eb] hover:underline">
                  View all
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: project.color }}
                    >
                      {project.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{project.name}</div>
                      <div className="text-sm text-gray-500">
                        {project._count?.tasks ?? 0} tasks · {project._count?.members ?? 0} members
                      </div>
                    </div>
                    <Badge className={STATUS_COLORS[project.status] ?? ""}>
                      {project.status.replace("_", " ")}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 className="font-semibold text-gray-900">Upcoming Tasks</h2>
                <Link href="/tasks" className="text-sm text-[#2563eb] hover:underline">
                  View all
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-4 px-6 py-3">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: task.project?.color ?? "#2563eb" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{task.title}</div>
                      <div className="text-xs text-gray-500">{task.project?.name}</div>
                    </div>
                    {task.assignee && (
                      <Avatar name={task.assignee.name} avatar={task.assignee.avatar} size="sm" />
                    )}
                    <Badge className={PRIORITY_COLORS[task.priority] ?? ""}>{task.priority}</Badge>
                    <span
                      className={`text-xs whitespace-nowrap ${
                        isOverdue(task.dueDate) ? "text-red-600 font-medium" : "text-gray-500"
                      }`}
                    >
                      {formatDueDate(task.dueDate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-[#2563eb]" />
                <h2 className="font-semibold text-gray-900">Progress</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Task Completion</span>
                    <span className="font-medium">{completionRate}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-[#2563eb] transition-all"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg bg-emerald-50 p-3 text-center">
                    <div className="text-2xl font-bold text-emerald-700">{stats.completedTasks}</div>
                    <div className="text-xs text-emerald-600">Completed</div>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 text-center">
                    <div className="text-2xl font-bold text-amber-700">{stats.overdueTasks}</div>
                    <div className="text-xs text-amber-600">Overdue</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-3 px-6 py-3 border-b border-gray-50 last:border-0">
                    {activity.user && (
                      <Avatar name={activity.user.name} avatar={activity.user.avatar} size="sm" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{activity.user?.name}</span>{" "}
                        {activity.action}
                        {activity.details && (
                          <span className="text-gray-500"> — {activity.details}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatRelativeDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
