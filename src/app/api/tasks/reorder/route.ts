import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TASK_STATUSES } from "@/types";

interface ReorderItem {
  id: string;
  order: number;
  status?: string;
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tasks } = body as { tasks: ReorderItem[] };

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: "tasks array is required" },
        { status: 400 }
      );
    }

    for (const item of tasks) {
      if (!item.id || typeof item.order !== "number") {
        return NextResponse.json(
          { error: "Each task must have id and order" },
          { status: 400 }
        );
      }
      if (
        item.status &&
        !(TASK_STATUSES as readonly string[]).includes(item.status)
      ) {
        return NextResponse.json(
          { error: `Invalid status: ${item.status}` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.$transaction(
      tasks.map((item) =>
        prisma.task.update({
          where: { id: item.id },
          data: {
            order: item.order,
            ...(item.status !== undefined && { status: item.status }),
          },
          select: {
            id: true,
            title: true,
            status: true,
            order: true,
            projectId: true,
          },
        })
      )
    );

    return NextResponse.json({ success: true, tasks: updated });
  } catch (error) {
    console.error("Tasks reorder error:", error);
    return NextResponse.json(
      { error: "Failed to reorder tasks" },
      { status: 500 }
    );
  }
}
