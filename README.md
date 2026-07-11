# ProjectHub — Zoho-Style Project Management

A full-featured project management application inspired by Zoho Projects. Built with Next.js, TypeScript, Tailwind CSS, and SQLite.

![ProjectHub](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss)

## Features

- **Dashboard** — Overview with stats, recent projects, upcoming tasks, and activity feed
- **Projects** — Create, manage, and track projects with status, priority, and team members
- **Tasks (Kanban Board)** — Drag-and-drop task management with To Do, In Progress, Review, and Done columns
- **Milestones** — Track key deliverables and deadlines per project
- **Team Management** — Add team members with roles (Admin, Manager, Member)
- **Time Logging** — Log hours against tasks with filtering by project

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | SQLite via Prisma ORM |
| Drag & Drop | @dnd-kit |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed sample data
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Commands

```bash
npm run db:migrate   # Apply migrations
npm run db:seed      # Seed sample data
npm run db:reset     # Reset and re-seed database
```

## Project Structure

```
src/
├── app/
│   ├── api/           # REST API routes
│   ├── projects/      # Projects pages
│   ├── tasks/         # Kanban board
│   ├── milestones/    # Milestones page
│   ├── team/          # Team management
│   └── timelogs/      # Time tracking
├── components/
│   ├── layout/        # Sidebar, header
│   └── ui/            # Reusable UI components
├── lib/               # Utilities, Prisma client
└── types/             # TypeScript interfaces
prisma/
├── schema.prisma      # Database schema
└── seed.ts            # Sample data seeder
```

## Sample Data

The seed script creates:
- 5 team members with different roles
- 4 projects (Website Redesign, Mobile App, CRM Integration, Marketing Campaign)
- 10 tasks across projects with various statuses
- 3 milestones
- Time logs, comments, and activity entries

## License

MIT
