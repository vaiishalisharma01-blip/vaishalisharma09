import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MILESTONE_STATUSES } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const milestones = await prisma.milestone.findMany({
      where,
      orderBy: { dueDate: "asc" },
      include: {
        project: {
          select: { id: true, name: true, color: true },
        },
        _count: { select: { tasks: true } },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
        },
      },
    });

    return NextResponse.json(milestones);
  } catch (error) {
    console.error("Milestones GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch milestones" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, projectId, dueDate, status } = body;

    if (!title || !projectId) {
      return NextResponse.json(
        { error: "Title and projectId are required" },
        { status: 400 }
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

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const milestone = await prisma.$transaction(async (tx) => {
      const created = await tx.milestone.create({
        data: {
          title,
          description: description ?? null,
          projectId,
          dueDate: dueDate ? new Date(dueDate) : null,
          status: status ?? "pending",
        },
        include: {
          project: {
            select: { id: true, name: true, color: true },
          },
        },
      });

      await tx.activity.create({
        data: {
          type: "milestone_created",
          description: `Created milestone "${title}"`,
          userId: project.ownerId,
          projectId,
          metadata: JSON.stringify({ milestoneId: created.id }),
        },
      });

      return created;
    });

    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    console.error("Milestones POST error:", error);
    return NextResponse.json(
      { error: "Failed to create milestone" },
      { status: 500 }
    );
  }
}
