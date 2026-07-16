import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local SQLite native module — not used on Vercel (Turso instead)
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
};

export default nextConfig;
