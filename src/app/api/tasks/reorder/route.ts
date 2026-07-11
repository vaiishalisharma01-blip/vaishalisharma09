import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const updates = body.tasks as { id: string; status: string; position: number }[];

  await prisma.$transaction(
    updates.map((task) =>
      prisma.task.update({
        where: { id: task.id },
        data: { status: task.status, position: task.position },
      })
    )
  );

  return NextResponse.json({ success: true });
}
