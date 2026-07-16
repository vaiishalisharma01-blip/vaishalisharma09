import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma CLI (generate / db push) ONLY supports file: SQLite URLs.
// Do NOT put libsql:// here — Turso schema is applied via `turso db shell`.
// Runtime app uses TURSO_* through the PrismaLibSql adapter in src/lib/prisma.ts.
const databaseUrl =
  process.env.DATABASE_URL?.startsWith("file:")
    ? process.env.DATABASE_URL
    : "file:./prisma/dev.db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
