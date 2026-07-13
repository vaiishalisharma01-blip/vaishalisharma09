import "dotenv/config";
import { defineConfig } from "prisma/config";

// Fallback URL is only used by Prisma CLI (generate/migrate), not at runtime.
// On Vercel, set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN for the live app.
const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.TURSO_DATABASE_URL ??
  "file:./prisma/dev.db";

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
