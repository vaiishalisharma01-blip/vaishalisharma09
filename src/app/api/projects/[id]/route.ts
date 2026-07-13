import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PROJECT_STATUSES } from "@/types";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true, role: true },
            },
          },
        },
        tasks: {
          orderBy: [{ status: "asc" }, { order: "asc" }],
          include: {
            assignee: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            milestone: {
              select: { id: true, title: true, status: true },
            },
          },
        },
        milestones: {
          orderBy: { dueDate: "asc" },
          include: {
            _count: { select: { tasks: true } },
          },
        },
        _count: {
          select: { tasks: true, members: true, milestones: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Project GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, status, color, startDate, endDate, progress } =
      body;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (status && !PROJECT_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${PROJECT_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const project = await prisma.$transaction(async (tx) => {
      const updated = await tx.project.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(status !== undefined && { status }),
          ...(color !== undefined && { color }),
          ...(startDate !== undefined && {
            startDate: startDate ? new Date(startDate) : null,
          }),
          ...(endDate !== undefined && {
            endDate: endDate ? new Date(endDate) : null,
          }),
          ...(progress !== undefined && { progress }),
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      });

      if (status && status !== existing.status) {
        await tx.activity.create({
          data: {
            type: "project_status_changed",
            description: `Changed project status from ${existing.status} to ${status}`,
            userId: existing.ownerId,
            projectId: id,
            metadata: JSON.stringify({ from: existing.status, to: status }),
          },
        });
      }

      return updated;
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Project PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.project.delete({ where: { id } });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Project DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
