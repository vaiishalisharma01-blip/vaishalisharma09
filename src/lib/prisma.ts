import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();

  // Production / Vercel: Turso (libSQL over HTTP)
  if (tursoUrl && tursoToken) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSql } = require("@prisma/adapter-libsql") as typeof import("@prisma/adapter-libsql");
    const adapter = new PrismaLibSql({
      url: tursoUrl,
      authToken: tursoToken,
    });
    return new PrismaClient({ adapter });
  }

  // On Vercel without Turso env vars — fail with a clear message
  if (process.env.VERCEL) {
    throw new Error(
      "Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN. Add both in Vercel → Settings → Environment Variables, then Redeploy."
    );
  }

  // Local development: SQLite file
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3") as typeof import("@prisma/adapter-better-sqlite3");
    const adapter = new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL?.startsWith("file:")
        ? process.env.DATABASE_URL
        : "file:./prisma/dev.db",
    });
    return new PrismaClient({ adapter });
  } catch {
    throw new Error(
      "Local SQLite adapter missing. Run: npm install && npm run setup"
    );
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
