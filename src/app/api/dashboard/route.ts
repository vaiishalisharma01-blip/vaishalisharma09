import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

  return NextResponse.json({
    stats: {
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      totalHours: timeLogs._sum.hours ?? 0,
      teamMembers,
    },
    recentActivities,
    projects,
    upcomingTasks,
  });
}
