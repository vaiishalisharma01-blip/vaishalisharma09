import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await prisma.user.count();
    return NextResponse.json({
      status: "ok",
      message: "ProjectHub is running",
      timestamp,
      database: "connected",
    });
  } catch {
    return NextResponse.json(
      {
        status: "ok",
        message: "ProjectHub is running",
        timestamp,
        database: "error",
      },
      { status: 503 }
    );
  }
}
