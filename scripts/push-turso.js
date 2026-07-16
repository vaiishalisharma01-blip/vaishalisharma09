/**
 * Apply prisma/turso-schema.sql to Turso, then seed.
 * No Turso CLI required — uses @libsql/client.
 *
 * PowerShell:
 *   $env:TURSO_DATABASE_URL="libsql://...."
 *   $env:TURSO_AUTH_TOKEN="eyJ...."
 *   npm run db:turso
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { createClient } = require("@libsql/client");

async function main() {
  const url = (process.env.TURSO_DATABASE_URL || "").trim();
  const authToken = (process.env.TURSO_AUTH_TOKEN || "").trim();

  if (!url || !authToken) {
    console.error(`
Missing Turso credentials.

In PowerShell run:

  $env:TURSO_DATABASE_URL="libsql://YOUR-DB.turso.io"
  $env:TURSO_AUTH_TOKEN="YOUR-TOKEN"
  npm run db:turso
`);
    process.exit(1);
  }

  if (!url.startsWith("libsql://") && !url.startsWith("https://")) {
    console.error("TURSO_DATABASE_URL must start with libsql://");
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, "..", "prisma", "turso-schema.sql");
  if (!fs.existsSync(sqlPath)) {
    console.error("Missing prisma/turso-schema.sql — run: git pull origin main");
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, "utf8");
  // Split on statement boundaries; keep CREATE TABLE / INDEX blocks intact
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  console.log("Connecting to Turso:", url);
  const client = createClient({ url, authToken });

  console.log(`Applying ${statements.length} SQL statements...`);
  for (const statement of statements) {
    try {
      await client.execute(statement);
    } catch (err) {
      const msg = String(err?.message || err);
      // Ignore "already exists" so script is re-runnable
      if (/already exists/i.test(msg)) {
        console.log("  skip (exists):", statement.slice(0, 50).replace(/\s+/g, " "), "...");
        continue;
      }
      console.error("Failed on statement:\n", statement.slice(0, 200));
      throw err;
    }
  }
  console.log("Schema applied.");

  console.log("Seeding sample data...");
  execSync("npx tsx prisma/seed.ts", {
    stdio: "inherit",
    env: {
      ...process.env,
      TURSO_DATABASE_URL: url,
      TURSO_AUTH_TOKEN: authToken,
      DATABASE_URL: "file:./prisma/dev.db",
    },
    cwd: path.join(__dirname, ".."),
  });

  console.log(`
Done.

Next on Vercel → Settings → Environment Variables:
  TURSO_DATABASE_URL = ${url}
  TURSO_AUTH_TOKEN   = (your token)

Then Redeploy.
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
