import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const milestone = await prisma.milestone.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      status: body.status,
      dueDate: body.dueDate !== undefined
        ? body.dueDate ? new Date(body.dueDate) : null
        : undefined,
    },
    include: {
      project: true,
      _count: { select: { tasks: true } },
    },
  });

  return NextResponse.json(milestone);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.milestone.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
