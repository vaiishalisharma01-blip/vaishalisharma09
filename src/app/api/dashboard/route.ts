import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOverdue } from "@/lib/utils";

export async function GET() {
  try {
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
