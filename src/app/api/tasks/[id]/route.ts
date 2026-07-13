import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PRIORITIES, TASK_STATUSES } from "@/types";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
        reporter: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        project: {
          select: { id: true, name: true, color: true, status: true },
        },
        milestone: {
          select: { id: true, title: true, status: true, dueDate: true },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        timeLogs: {
          orderBy: { date: "desc" },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Task GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      assigneeId,
      milestoneId,
      dueDate,
      order,
      estimatedHours,
    } = body;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (status && !TASK_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${TASK_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    if (priority && !PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${PRIORITIES.join(", ")}` },
        { status: 400 }
      );
    }

    const task = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(status !== undefined && { status }),
          ...(priority !== undefined && { priority }),
          ...(assigneeId !== undefined && { assigneeId }),
          ...(milestoneId !== undefined && { milestoneId }),
          ...(dueDate !== undefined && {
            dueDate: dueDate ? new Date(dueDate) : null,
          }),
          ...(order !== undefined && { order }),
          ...(estimatedHours !== undefined && { estimatedHours }),
        },
        include: {
          assignee: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          project: {
            select: { id: true, name: true, color: true },
          },
        },
      });

      if (status && status !== existing.status) {
        await tx.activity.create({
          data: {
            type: "task_status_changed",
            description: `Changed task status from ${existing.status} to ${status}`,
            userId: existing.reporterId ?? existing.assigneeId ?? updated.projectId,
            projectId: existing.projectId,
            taskId: id,
            metadata: JSON.stringify({ from: existing.status, to: status }),
          },
        });
      }

      if (assigneeId !== undefined && assigneeId !== existing.assigneeId) {
        await tx.activity.create({
          data: {
            type: "task_assigned",
            description: `Reassigned task "${updated.title}"`,
            userId: existing.reporterId ?? existing.assigneeId ?? updated.projectId,
            projectId: existing.projectId,
            taskId: id,
            metadata: JSON.stringify({
              from: existing.assigneeId,
              to: assigneeId,
            }),
          },
        });
      }

      return updated;
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Task PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Task DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
