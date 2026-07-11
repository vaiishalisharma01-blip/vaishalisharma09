import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  const milestones = await prisma.milestone.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { dueDate: "asc" },
    include: {
      project: true,
      _count: { select: { tasks: true } },
    },
  });

  return NextResponse.json(milestones);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const milestone = await prisma.milestone.create({
    data: {
      name: body.name,
      description: body.description,
      status: body.status ?? "open",
      projectId: body.projectId,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
    include: {
      project: true,
      _count: { select: { tasks: true } },
    },
  });

  return NextResponse.json(milestone, { status: 201 });
}
