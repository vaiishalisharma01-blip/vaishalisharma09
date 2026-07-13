import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PRIORITIES, TASK_STATUSES } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const milestoneId = searchParams.get("milestoneId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (milestoneId) where.milestoneId = milestoneId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ status: "asc" }, { order: "asc" }],
      include: {
        assignee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        reporter: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        project: {
          select: { id: true, name: true, color: true, status: true },
        },
        milestone: {
          select: { id: true, title: true, status: true },
        },
        _count: {
          select: { comments: true, timeLogs: true },
        },
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Tasks GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      projectId,
      assigneeId,
      reporterId,
      milestoneId,
      dueDate,
      estimatedHours,
    } = body;

    if (!title || !projectId) {
      return NextResponse.json(
        { error: "Title and projectId are required" },
        { status: 400 }
      );
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

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const maxOrder = await prisma.task.aggregate({
      where: { projectId, status: status ?? "todo" },
      _max: { order: true },
    });

    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          title,
          description: description ?? null,
          status: status ?? "todo",
          priority: priority ?? "medium",
          projectId,
          assigneeId: assigneeId ?? null,
          reporterId: reporterId ?? project.ownerId,
          milestoneId: milestoneId ?? null,
          dueDate: dueDate ? new Date(dueDate) : null,
          order: (maxOrder._max.order ?? -1) + 1,
          estimatedHours: estimatedHours ?? null,
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

      await tx.activity.create({
        data: {
          type: "task_created",
          description: `Created task: ${title}`,
          userId: reporterId ?? project.ownerId,
          projectId,
          taskId: created.id,
        },
      });

      if (assigneeId) {
        await tx.activity.create({
          data: {
            type: "task_assigned",
            description: `Assigned task "${title}" to team member`,
            userId: reporterId ?? project.ownerId,
            projectId,
            taskId: created.id,
            metadata: JSON.stringify({ assigneeId }),
          },
        });
      }

      return created;
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Tasks POST error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
