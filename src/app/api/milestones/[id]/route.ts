import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MILESTONE_STATUSES } from "@/types";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, color: true, status: true },
        },
        tasks: {
          orderBy: [{ status: "asc" }, { order: "asc" }],
          include: {
            assignee: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        _count: { select: { tasks: true } },
      },
    });

    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(milestone);
  } catch (error) {
    console.error("Milestone GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch milestone" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, dueDate, status } = body;

    const existing = await prisma.milestone.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
    }

    if (status && !MILESTONE_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${MILESTONE_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const milestone = await prisma.$transaction(async (tx) => {
      const updated = await tx.milestone.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(dueDate !== undefined && {
            dueDate: dueDate ? new Date(dueDate) : null,
          }),
          ...(status !== undefined && { status }),
        },
        include: {
          project: {
            select: { id: true, name: true, color: true },
          },
          _count: { select: { tasks: true } },
        },
      });

      if (status === "completed" && existing.status !== "completed") {
        await tx.activity.create({
          data: {
            type: "milestone_completed",
            description: `Completed milestone "${updated.title}"`,
            userId: existing.project.ownerId,
            projectId: existing.projectId,
            metadata: JSON.stringify({ milestoneId: id }),
          },
        });
      }

      return updated;
    });

    return NextResponse.json(milestone);
  } catch (error) {
    console.error("Milestone PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update milestone" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existing = await prisma.milestone.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
    }

    await prisma.milestone.delete({ where: { id } });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Milestone DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete milestone" },
      { status: 500 }
    );
  }
}
