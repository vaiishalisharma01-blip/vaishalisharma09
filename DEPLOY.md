# Deploy to Vercel (Windows — no Turso CLI needed)

## Step 1 — Turso database + URL + token

1. Open https://turso.tech → create database
2. Copy **Database URL** (`libsql://...`)
3. Create/copy **Auth Token**

If you pasted a token in chat before, create a **new** token.

---

## Step 2 — Push schema + seed (PowerShell only)

```powershell
cd C:\Users\vaish\vaishalisharma09
git pull origin main

$env:TURSO_DATABASE_URL="libsql://YOUR-URL.turso.io"
$env:TURSO_AUTH_TOKEN="YOUR-TOKEN"
$env:DATABASE_URL="file:./prisma/dev.db"

npm run db:turso
```

You should see:
- `Applying ... SQL statements...`
- `Using Turso database: libsql://...`
- `Seed completed`

**Do not run** `npx prisma db push` with the Turso URL (that causes P1013).

---

## Step 3 — Vercel env vars + deploy

1. https://vercel.com → your project (or import `vaiishalisharma01-blip/vaishalisharma09`)
2. **Settings → Environment Variables**:

| Name | Value |
|------|-------|
| `TURSO_DATABASE_URL` | your `libsql://...` URL |
| `TURSO_AUTH_TOKEN` | your token |

3. **Deployments → Redeploy**

---

## Step 4 — Test

- `https://YOUR-APP.vercel.app/status` → green Connected  
- `https://YOUR-APP.vercel.app` → dashboard  

---

## Why "turso is not recognized"?

Turso’s official CLI on Windows needs **WSL**.  
This project uses `npm run db:turso` instead, so you **don’t need** the `turso` command.
