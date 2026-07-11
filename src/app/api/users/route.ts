import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          assignedTasks: true,
          projectMembers: true,
        },
      },
    },
  });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      role: body.role ?? "member",
      avatar: body.avatar ?? body.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
    },
  });

  return NextResponse.json(user, { status: 201 });
}
