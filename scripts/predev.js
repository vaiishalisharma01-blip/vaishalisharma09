#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");
const envExample = path.join(root, ".env.example");
const dbPath = path.join(root, "prisma", "dev.db");

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit" });
}

if (!fs.existsSync(envPath)) {
  console.log("Creating .env from .env.example...");
  if (fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envPath);
  } else {
    fs.writeFileSync(envPath, 'DATABASE_URL="file:./prisma/dev.db"\n');
  }
}

if (!fs.existsSync(dbPath)) {
  console.log("Setting up database...");
  run("npm run setup");
} else {
  try {
    require.resolve(path.join(root, "src/generated/prisma/client"));
  } catch {
    run("npx prisma generate");
  }
}

console.log("\n✓ ProjectHub starting at http://localhost:3000");
console.log("✓ Health check: http://localhost:3000/status\n");
