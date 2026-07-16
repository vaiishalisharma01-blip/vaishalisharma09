import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();

  // Prefer Turso whenever both vars are set (used for Vercel seeding)
  if (tursoUrl && tursoToken) {
    if (!tursoUrl.startsWith("libsql://") && !tursoUrl.startsWith("https://")) {
      throw new Error(
        `TURSO_DATABASE_URL must start with libsql:// (got: ${tursoUrl.slice(0, 40)}...)`
      );
    }
    console.log("Using Turso database:", tursoUrl);
    const adapter = new PrismaLibSql({
      url: tursoUrl,
      authToken: tursoToken,
    });
    return new PrismaClient({ adapter });
  }

  // Local SQLite — never use libsql:// here (Prisma CLI / better-sqlite3 can't open it)
  let sqliteUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  if (sqliteUrl.startsWith("libsql://") || sqliteUrl.startsWith("https://")) {
    console.warn(
      "DATABASE_URL is a Turso URL but TURSO_AUTH_TOKEN is missing — falling back to file:./prisma/dev.db"
    );
    sqliteUrl = "file:./prisma/dev.db";
  }
  console.log("Using local SQLite:", sqliteUrl);
  const adapter = new PrismaBetterSqlite3({ url: sqliteUrl });
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.activity.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.timeLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "alice@projecthub.io",
        name: "Alice Chen",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
        role: "admin",
        jobTitle: "Engineering Lead",
        department: "Engineering",
      },
    }),
    prisma.user.create({
      data: {
        email: "bob@projecthub.io",
        name: "Bob Martinez",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
        role: "manager",
        jobTitle: "Product Manager",
        department: "Product",
      },
    }),
    prisma.user.create({
      data: {
        email: "carol@projecthub.io",
        name: "Carol Williams",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
        role: "member",
        jobTitle: "Senior Developer",
        department: "Engineering",
      },
    }),
    prisma.user.create({
      data: {
        email: "david@projecthub.io",
        name: "David Kim",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
        role: "member",
        jobTitle: "UX Designer",
        department: "Design",
      },
    }),
    prisma.user.create({
      data: {
        email: "eva@projecthub.io",
        name: "Eva Thompson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Eva",
        role: "member",
        jobTitle: "QA Engineer",
        department: "Quality",
      },
    }),
  ]);

  const [alice, bob, carol, david, eva] = users;

  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: "ProjectHub Platform",
        description: "Core project management platform with Zoho-style features",
        status: "active",
        color: "blue",
        ownerId: alice.id,
        startDate: new Date("2025-01-15"),
        endDate: new Date("2026-06-30"),
        progress: 45,
      },
    }),
    prisma.project.create({
      data: {
        name: "Mobile App v2",
        description: "Next-generation mobile experience for iOS and Android",
        status: "active",
        color: "purple",
        ownerId: bob.id,
        startDate: new Date("2025-03-01"),
        endDate: new Date("2026-03-31"),
        progress: 30,
      },
    }),
    prisma.project.create({
      data: {
        name: "API Gateway Migration",
        description: "Migrate legacy services to unified API gateway",
        status: "on_hold",
        color: "orange",
        ownerId: alice.id,
        startDate: new Date("2025-06-01"),
        endDate: new Date("2026-01-31"),
        progress: 15,
      },
    }),
    prisma.project.create({
      data: {
        name: "Design System Refresh",
        description: "Update component library and design tokens",
        status: "completed",
        color: "green",
        ownerId: david.id,
        startDate: new Date("2024-09-01"),
        endDate: new Date("2025-12-15"),
        progress: 100,
      },
    }),
  ]);

  const [platform, mobile, apiGateway, designSystem] = projects;

  await prisma.projectMember.createMany({
    data: [
      { projectId: platform.id, userId: alice.id, role: "owner" },
      { projectId: platform.id, userId: bob.id, role: "admin" },
      { projectId: platform.id, userId: carol.id, role: "member" },
      { projectId: platform.id, userId: david.id, role: "member" },
      { projectId: mobile.id, userId: bob.id, role: "owner" },
      { projectId: mobile.id, userId: carol.id, role: "member" },
      { projectId: mobile.id, userId: eva.id, role: "member" },
      { projectId: apiGateway.id, userId: alice.id, role: "owner" },
      { projectId: apiGateway.id, userId: carol.id, role: "member" },
      { projectId: designSystem.id, userId: david.id, role: "owner" },
      { projectId: designSystem.id, userId: bob.id, role: "viewer" },
    ],
  });

  const milestones = await Promise.all([
    prisma.milestone.create({
      data: {
        title: "MVP Launch",
        description: "Minimum viable product with core PM features",
        projectId: platform.id,
        dueDate: new Date("2025-06-30"),
        status: "completed",
      },
    }),
    prisma.milestone.create({
      data: {
        title: "Beta Release",
        description: "Public beta with task boards and time tracking",
        projectId: platform.id,
        dueDate: new Date("2026-03-31"),
        status: "in_progress",
      },
    }),
    prisma.milestone.create({
      data: {
        title: "App Store Submission",
        description: "Submit mobile app to iOS and Android stores",
        projectId: mobile.id,
        dueDate: new Date("2026-02-28"),
        status: "pending",
      },
    }),
  ]);

  const [mvpMilestone, betaMilestone, appStoreMilestone] = milestones;

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: "Implement Kanban board drag-and-drop",
        description: "Add drag-and-drop reordering for task cards across columns",
        status: "in_progress",
        priority: "high",
        projectId: platform.id,
        assigneeId: carol.id,
        reporterId: bob.id,
        milestoneId: betaMilestone.id,
        dueDate: new Date("2026-04-15"),
        order: 0,
        estimatedHours: 16,
      },
    }),
    prisma.task.create({
      data: {
        title: "Design dashboard analytics widgets",
        description: "Create wireframes for project health and velocity charts",
        status: "review",
        priority: "medium",
        projectId: platform.id,
        assigneeId: david.id,
        reporterId: bob.id,
        milestoneId: betaMilestone.id,
        dueDate: new Date("2026-04-10"),
        order: 1,
        estimatedHours: 8,
      },
    }),
    prisma.task.create({
      data: {
        title: "Set up CI/CD pipeline",
        description: "Configure GitHub Actions for automated testing and deployment",
        status: "done",
        priority: "high",
        projectId: platform.id,
        assigneeId: alice.id,
        reporterId: alice.id,
        milestoneId: mvpMilestone.id,
        dueDate: new Date("2025-05-01"),
        order: 2,
        estimatedHours: 12,
      },
    }),
    prisma.task.create({
      data: {
        title: "Write API documentation",
        description: "Document all REST endpoints with OpenAPI spec",
        status: "todo",
        priority: "medium",
        projectId: platform.id,
        assigneeId: carol.id,
        reporterId: bob.id,
        milestoneId: betaMilestone.id,
        dueDate: new Date("2026-05-01"),
        order: 3,
        estimatedHours: 10,
      },
    }),
    prisma.task.create({
      data: {
        title: "Implement push notifications",
        description: "Add FCM and APNs support for task reminders",
        status: "in_progress",
        priority: "urgent",
        projectId: mobile.id,
        assigneeId: carol.id,
        reporterId: bob.id,
        milestoneId: appStoreMilestone.id,
        dueDate: new Date("2026-01-20"),
        order: 0,
        estimatedHours: 24,
      },
    }),
    prisma.task.create({
      data: {
        title: "Create onboarding flow",
        description: "Design and implement first-time user onboarding screens",
        status: "todo",
        priority: "high",
        projectId: mobile.id,
        assigneeId: david.id,
        reporterId: bob.id,
        milestoneId: appStoreMilestone.id,
        dueDate: new Date("2026-02-01"),
        order: 1,
        estimatedHours: 20,
      },
    }),
    prisma.task.create({
      data: {
        title: "Performance testing on low-end devices",
        description: "Test app performance on devices with 2GB RAM or less",
        status: "todo",
        priority: "medium",
        projectId: mobile.id,
        assigneeId: eva.id,
        reporterId: bob.id,
        dueDate: new Date("2026-02-15"),
        order: 2,
        estimatedHours: 8,
      },
    }),
    prisma.task.create({
      data: {
        title: "Audit legacy API endpoints",
        description: "Inventory all endpoints that need migration to the gateway",
        status: "done",
        priority: "high",
        projectId: apiGateway.id,
        assigneeId: carol.id,
        reporterId: alice.id,
        dueDate: new Date("2025-07-15"),
        order: 0,
        estimatedHours: 6,
      },
    }),
    prisma.task.create({
      data: {
        title: "Update color tokens",
        description: "Refresh primary and secondary color palette",
        status: "done",
        priority: "low",
        projectId: designSystem.id,
        assigneeId: david.id,
        reporterId: david.id,
        dueDate: new Date("2025-10-01"),
        order: 0,
        estimatedHours: 4,
      },
    }),
    prisma.task.create({
      data: {
        title: "Fix overdue task notifications",
        description: "Email alerts for tasks past due date are not sending",
        status: "todo",
        priority: "urgent",
        projectId: platform.id,
        assigneeId: eva.id,
        reporterId: bob.id,
        dueDate: new Date("2025-07-01"),
        order: 4,
        estimatedHours: 6,
      },
    }),
  ]);

  const [
    kanbanTask,
    dashboardTask,
    cicdTask,
    apiDocsTask,
    pushNotifTask,
    onboardingTask,
    perfTestTask,
    auditTask,
    colorTokensTask,
    overdueNotifTask,
  ] = tasks;

  await prisma.timeLog.createMany({
    data: [
      {
        taskId: kanbanTask.id,
        userId: carol.id,
        hours: 4.5,
        description: "Implemented drag handlers and column drop zones",
        date: new Date("2026-04-01"),
      },
      {
        taskId: kanbanTask.id,
        userId: carol.id,
        hours: 3,
        description: "Added optimistic UI updates",
        date: new Date("2026-04-02"),
      },
      {
        taskId: dashboardTask.id,
        userId: david.id,
        hours: 5,
        description: "Created wireframes for velocity and burndown charts",
        date: new Date("2026-04-03"),
      },
      {
        taskId: cicdTask.id,
        userId: alice.id,
        hours: 8,
        description: "Configured GitHub Actions workflows",
        date: new Date("2025-04-28"),
      },
      {
        taskId: cicdTask.id,
        userId: alice.id,
        hours: 4,
        description: "Set up staging and production environments",
        date: new Date("2025-04-29"),
      },
      {
        taskId: pushNotifTask.id,
        userId: carol.id,
        hours: 6,
        description: "Integrated FCM SDK",
        date: new Date("2026-04-05"),
      },
      {
        taskId: auditTask.id,
        userId: carol.id,
        hours: 5.5,
        description: "Documented 47 legacy endpoints",
        date: new Date("2025-07-10"),
      },
      {
        taskId: colorTokensTask.id,
        userId: david.id,
        hours: 3,
        description: "Updated Figma and code tokens",
        date: new Date("2025-09-28"),
      },
    ],
  });

  await prisma.comment.createMany({
    data: [
      {
        taskId: kanbanTask.id,
        userId: bob.id,
        content: "Make sure the drag animation feels smooth — target 60fps.",
      },
      {
        taskId: kanbanTask.id,
        userId: carol.id,
        content: "Using @dnd-kit for the implementation. Works great so far.",
      },
      {
        taskId: dashboardTask.id,
        userId: alice.id,
        content: "Love the velocity chart concept. Can we add a date range filter?",
      },
      {
        taskId: pushNotifTask.id,
        userId: eva.id,
        content: "We should test notification delivery on Android 12+ with the new permission model.",
      },
      {
        taskId: overdueNotifTask.id,
        userId: bob.id,
        content: "This is blocking the beta release. Priority fix needed.",
      },
      {
        taskId: apiDocsTask.id,
        userId: alice.id,
        content: "Please include request/response examples for each endpoint.",
      },
    ],
  });

  await prisma.activity.createMany({
    data: [
      {
        type: "project_created",
        description: 'Created project "ProjectHub Platform"',
        userId: alice.id,
        projectId: platform.id,
      },
      {
        type: "project_created",
        description: 'Created project "Mobile App v2"',
        userId: bob.id,
        projectId: mobile.id,
      },
      {
        type: "task_created",
        description: "Created task: Implement Kanban board drag-and-drop",
        userId: bob.id,
        projectId: platform.id,
        taskId: kanbanTask.id,
      },
      {
        type: "task_status_changed",
        description: 'Moved "Set up CI/CD pipeline" to Done',
        userId: alice.id,
        projectId: platform.id,
        taskId: cicdTask.id,
        metadata: JSON.stringify({ from: "in_progress", to: "done" }),
      },
      {
        type: "task_assigned",
        description: "Assigned Carol to Implement Kanban board drag-and-drop",
        userId: bob.id,
        projectId: platform.id,
        taskId: kanbanTask.id,
        metadata: JSON.stringify({ assigneeId: carol.id }),
      },
      {
        type: "comment_added",
        description: "Commented on Implement Kanban board drag-and-drop",
        userId: bob.id,
        projectId: platform.id,
        taskId: kanbanTask.id,
      },
      {
        type: "milestone_completed",
        description: 'Completed milestone "MVP Launch"',
        userId: alice.id,
        projectId: platform.id,
        metadata: JSON.stringify({ milestoneId: mvpMilestone.id }),
      },
      {
        type: "time_logged",
        description: "Logged 4.5 hours on Implement Kanban board drag-and-drop",
        userId: carol.id,
        projectId: platform.id,
        taskId: kanbanTask.id,
        metadata: JSON.stringify({ hours: 4.5 }),
      },
      {
        type: "task_created",
        description: "Created task: Implement push notifications",
        userId: bob.id,
        projectId: mobile.id,
        taskId: pushNotifTask.id,
      },
      {
        type: "project_completed",
        description: 'Completed project "Design System Refresh"',
        userId: david.id,
        projectId: designSystem.id,
      },
    ],
  });

  console.log("Seed completed:");
  console.log(`  Users: ${users.length}`);
  console.log(`  Projects: ${projects.length}`);
  console.log(`  Tasks: ${tasks.length}`);
  console.log(`  Milestones: ${milestones.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
