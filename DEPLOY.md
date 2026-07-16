# Fix: Prisma cannot use libsql:// with `db push`

`npx prisma db push` only works with local SQLite (`file:...`).
For Turso, apply SQL with the Turso CLI, then seed with the adapter.

## SECURITY FIRST

If you pasted your Turso token in chat or a screenshot, **revoke it** and create a new one:

```powershell
turso db tokens create projecthub
```

(Use your real DB name — yours may be `projeecthub-...` with the double "e".)

---

## Correct steps (PowerShell)

### 1) Install Turso CLI (if needed)

https://docs.turso.tech/cli/installation

```powershell
turso auth login
turso db list
```

Note the **database name** from the list (first column), e.g. `projeecthub-vaiishalisharma01-blip` or `projecthub`.

### 2) Pull latest code

```powershell
cd C:\Users\vaish\vaishalisharma09
git pull origin main
```

### 3) Apply schema to Turso (NOT prisma db push)

```powershell
# Replace DB_NAME with the name from `turso db list`
Get-Content .\prisma\turso-schema.sql | turso db shell DB_NAME
```

Example:

```powershell
Get-Content .\prisma\turso-schema.sql | turso db shell projeecthub-vaiishalisharma01-blip
```

### 4) Seed data (uses Turso adapter — keep BOTH env vars)

```powershell
$env:TURSO_DATABASE_URL="libsql://YOUR-FULL-URL.turso.io"
$env:TURSO_AUTH_TOKEN="YOUR-NEW-TOKEN"
# Important: do NOT set DATABASE_URL to the libsql URL
$env:DATABASE_URL="file:./prisma/dev.db"

npm run db:seed
```

You should see: `Using Turso database: libsql://...`

### 5) Vercel env vars + Redeploy

| Name | Value |
|------|-------|
| `TURSO_DATABASE_URL` | `libsql://...` |
| `TURSO_AUTH_TOKEN` | your token |

Then **Redeploy**.

---

## Why your error happened

| Command | What went wrong |
|---------|-----------------|
| `prisma db push` + `libsql://` | Prisma SQLite driver does not understand `libsql://` → P1013 |
| `npm run db:seed` | Fell back to local SQLite and `prisma/` folder path failed |

---

## Optional helper script

```powershell
.\scripts\push-turso.ps1 -Url "libsql://..." -Token "eyJ..."
```
