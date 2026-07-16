# Finish Vercel Deploy (Windows)

ProjectHub needs a cloud database (Turso) because Vercel cannot use a local SQLite file.

## Step 1 — Create Turso database (5 min)

1. Open https://turso.tech and sign up / log in (GitHub is fine)
2. In the Turso dashboard: **Create Database** → name it `projecthub`
3. Open the database → copy:
   - **URL** (starts with `libsql://...`)
   - Create a **token** and copy it

### Optional: Turso CLI (PowerShell)

```powershell
# Install: https://docs.turso.tech/cli/installation
turso auth login
turso db create projecthub
turso db show projecthub --url
turso db tokens create projecthub
```

---

## Step 2 — Push tables + sample data to Turso

In PowerShell:

```powershell
cd C:\Users\vaish\vaishalisharma09
git pull origin main

$env:TURSO_DATABASE_URL="libsql://PASTE-YOUR-URL-HERE"
$env:TURSO_AUTH_TOKEN="PASTE-YOUR-TOKEN-HERE"
$env:DATABASE_URL=$env:TURSO_DATABASE_URL

npx prisma db push
npm run db:seed
```

If `db push` fails against Turso, apply the migration SQL instead:

```powershell
turso db shell projecthub < .\prisma\migrations\*\migration.sql
```

(Use the actual migration folder name from `prisma\migrations`.)

---

## Step 3 — Deploy / Redeploy on Vercel

1. Open https://vercel.com/login → sign in with **GitHub**
2. Open https://vercel.com/new
3. Import **`vaiishalisharma01-blip/vaishalisharma09`**
4. Before Deploy → **Environment Variables** → add for Production + Preview:

| Name | Value |
|------|-------|
| `TURSO_DATABASE_URL` | your `libsql://...` URL |
| `TURSO_AUTH_TOKEN` | your Turso token |

5. Click **Deploy**

### If the project already exists on Vercel

1. Open the project → **Settings** → **Environment Variables**
2. Add/update the two variables above
3. Go to **Deployments** → open latest → **⋯** → **Redeploy**

---

## Step 4 — Verify it works

Open:

- `https://YOUR-APP.vercel.app/status` → green **Connected**
- `https://YOUR-APP.vercel.app` → dashboard with projects

---

## Common errors

| Error | Fix |
|-------|-----|
| Build fails on `DATABASE_URL` | Pull latest `main` (already fixed) and redeploy |
| App loads but empty / DB error | Env vars missing, or schema not pushed to Turso |
| `/status` shows disconnected | Check Turso URL + token on Vercel, then redeploy |

## Local vs Vercel

| | Local | Vercel |
|--|-------|--------|
| URL | http://localhost:3000 | https://your-app.vercel.app |
| Database | SQLite file | Turso |
| Start | `npm run dev` | Deploy once, then always online |
