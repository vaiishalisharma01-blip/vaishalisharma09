import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: true,
      reporter: true,
      project: true,
      milestone: true,
      comments: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
      timeLogs: {
        include: { user: true },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const task = await prisma.task.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      assigneeId: body.assigneeId,
      milestoneId: body.milestoneId,
      position: body.position,
      dueDate: body.dueDate !== undefined
        ? body.dueDate ? new Date(body.dueDate) : null
        : undefined,
    },
    include: {
      assignee: true,
      project: true,
      milestone: true,
      _count: { select: { comments: true, timeLogs: true } },
    },
  });

  return NextResponse.json(task);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
