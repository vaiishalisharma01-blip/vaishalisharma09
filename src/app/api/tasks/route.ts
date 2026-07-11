import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");

  const tasks = await prisma.task.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: [{ status: "asc" }, { position: "asc" }],
    include: {
      assignee: true,
      reporter: true,
      project: true,
      milestone: true,
      _count: { select: { comments: true, timeLogs: true } },
    },
  });

  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const maxPosition = await prisma.task.aggregate({
    where: { projectId: body.projectId, status: body.status ?? "todo" },
    _max: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description,
      status: body.status ?? "todo",
      priority: body.priority ?? "medium",
      projectId: body.projectId,
      assigneeId: body.assigneeId || null,
      reporterId: body.reporterId || null,
      milestoneId: body.milestoneId || null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      position: (maxPosition._max.position ?? -1) + 1,
    },
    include: {
      assignee: true,
      project: true,
      milestone: true,
      _count: { select: { comments: true, timeLogs: true } },
    },
  });

  if (body.reporterId) {
    await prisma.activity.create({
      data: {
        action: "created task",
        details: task.title,
        projectId: body.projectId,
        userId: body.reporterId,
      },
    });
  }

  return NextResponse.json(task, { status: 201 });
}
