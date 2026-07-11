import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { tasks: true, members: true, milestones: true } },
      members: { include: { user: true } },
    },
  });
  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const project = await prisma.project.create({
    data: {
      name: body.name,
      description: body.description,
      status: body.status ?? "active",
      priority: body.priority ?? "medium",
      color: body.color ?? "#2563eb",
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      members: body.ownerId
        ? { create: { userId: body.ownerId, role: "owner" } }
        : undefined,
    },
    include: {
      _count: { select: { tasks: true, members: true, milestones: true } },
      members: { include: { user: true } },
    },
  });

  if (body.ownerId) {
    await prisma.activity.create({
      data: {
        action: "created project",
        details: project.name,
        projectId: project.id,
        userId: body.ownerId,
      },
    });
  }

  return NextResponse.json(project, { status: 201 });
}
