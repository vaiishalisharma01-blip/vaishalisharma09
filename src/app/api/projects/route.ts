import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PROJECT_STATUSES } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const ownerId = searchParams.get("ownerId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (ownerId) where.ownerId = ownerId;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        _count: {
          select: { tasks: true, members: true, milestones: true },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Projects GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, status, color, ownerId, startDate, endDate } =
      body;

    if (!name || !ownerId) {
      return NextResponse.json(
        { error: "Name and ownerId are required" },
        { status: 400 }
      );
    }

    if (status && !PROJECT_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${PROJECT_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          name,
          description: description ?? null,
          status: status ?? "active",
          color: color ?? "blue",
          ownerId,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: created.id,
          userId: ownerId,
          role: "owner",
        },
      });

      await tx.activity.create({
        data: {
          type: "project_created",
          description: `Created project "${name}"`,
          userId: ownerId,
          projectId: created.id,
        },
      });

      return created;
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Projects POST error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
