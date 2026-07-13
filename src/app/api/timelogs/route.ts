import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const taskId = searchParams.get("taskId");
    const userId = searchParams.get("userId");
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (taskId) where.taskId = taskId;
    if (userId) where.userId = userId;

    if (projectId) {
      const timeLogs = await prisma.timeLog.findMany({
        where: {
          task: { projectId },
          ...(userId && { userId }),
        },
        orderBy: { date: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          task: {
            select: {
              id: true,
              title: true,
              projectId: true,
              project: { select: { id: true, name: true, color: true } },
            },
          },
        },
      });

      return NextResponse.json(timeLogs);
    }

    const timeLogs = await prisma.timeLog.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
            project: { select: { id: true, name: true, color: true } },
          },
        },
      },
    });

    return NextResponse.json(timeLogs);
  } catch (error) {
    console.error("TimeLogs GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch time logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, userId, hours, description, date } = body;

    if (!taskId || !userId || hours === undefined) {
      return NextResponse.json(
        { error: "taskId, userId, and hours are required" },
        { status: 400 }
      );
    }

    if (typeof hours !== "number" || hours <= 0) {
      return NextResponse.json(
        { error: "hours must be a positive number" },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, title: true, projectId: true },
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const timeLog = await prisma.$transaction(async (tx) => {
      const created = await tx.timeLog.create({
        data: {
          taskId,
          userId,
          hours,
          description: description ?? null,
          date: date ? new Date(date) : new Date(),
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          task: {
            select: {
              id: true,
              title: true,
              project: { select: { id: true, name: true, color: true } },
            },
          },
        },
      });

      await tx.activity.create({
        data: {
          type: "time_logged",
          description: `Logged ${hours} hours on "${task.title}"`,
          userId,
          projectId: task.projectId,
          taskId,
          metadata: JSON.stringify({ hours, timeLogId: created.id }),
        },
      });

      return created;
    });

    return NextResponse.json(timeLog, { status: 201 });
  } catch (error) {
    console.error("TimeLogs POST error:", error);
    return NextResponse.json(
      { error: "Failed to create time log" },
      { status: 500 }
    );
  }
}
