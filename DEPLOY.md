# Deploy to Vercel

ProjectHub uses **SQLite locally** and **Turso (free)** for production on Vercel.

## Step 1 — Create a Turso database (free)

1. Sign up at https://turso.tech
2. Install Turso CLI: https://docs.turso.tech/cli/installation
3. Run:

```bash
turso auth login
turso db create projecthub
turso db show projecthub --url
turso db tokens create projecthub
```

Save the **URL** and **token**.

## Step 2 — Push schema to Turso

```bash
export TURSO_DATABASE_URL="libsql://your-db-url"
export TURSO_AUTH_TOKEN="your-token"

npx prisma db push
npm run db:seed
```

## Step 3 — Deploy on Vercel

### Option A: GitHub (recommended)

1. Go to https://vercel.com/new
2. Import **vaiishalisharma01-blip/vaishalisharma09**
3. Add **Environment Variables**:

| Name | Value |
|------|-------|
| `TURSO_DATABASE_URL` | `libsql://...` from Turso |
| `TURSO_AUTH_TOKEN` | token from Turso |
| `DATABASE_URL` | `file:./prisma/dev.db` *(optional — only needed if build still complains)* |

4. Click **Deploy**

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN
vercel --prod
```

## Step 4 — Verify

Open your Vercel URL:
- `https://your-app.vercel.app/status` — green Connected
- `https://your-app.vercel.app` — dashboard
