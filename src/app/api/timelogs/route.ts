import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  const timeLogs = await prisma.timeLog.findMany({
    where: projectId
      ? { task: { projectId } }
      : undefined,
    orderBy: { date: "desc" },
    include: {
      user: true,
      task: { include: { project: true } },
    },
  });

  return NextResponse.json(timeLogs);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const timeLog = await prisma.timeLog.create({
    data: {
      hours: body.hours,
      description: body.description,
      taskId: body.taskId,
      userId: body.userId,
      date: body.date ? new Date(body.date) : new Date(),
    },
    include: {
      user: true,
      task: { include: { project: true } },
    },
  });

  await prisma.activity.create({
    data: {
      action: "logged time",
      details: `${body.hours} hours on ${timeLog.task.title}`,
      projectId: timeLog.task.projectId,
      userId: body.userId,
    },
  });

  return NextResponse.json(timeLog, { status: 201 });
}
