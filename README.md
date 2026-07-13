# ProjectHub — Zoho-Style Project Management

## Quick Start

```bash
npm install
npm run dev
```

Open **http://localhost:3000**

### Check localhost is connected

Open **http://localhost:3000/status** — if you see a green "Connected" badge, your browser is talking to the server correctly.

## Features

- Dashboard, Projects, Kanban Tasks, Milestones, Team, Time Logs
- `/status` page — live health check for localhost connection
- `/api/health` — JSON health endpoint

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Connection refused | Run `npm run dev` and keep terminal open |
| Port 3000 busy | `npm run dev -- -p 3001` |
| Fresh start | `npm run db:reset` |

## Commands

```bash
npm run dev      # Start (auto-creates .env + DB on first run)
npm run setup    # Manual DB setup + seed
npm run build    # Production build
```
