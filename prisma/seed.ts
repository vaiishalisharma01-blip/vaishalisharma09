import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
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
        name: "Alex Morgan",
        email: "alex@company.com",
        role: "admin",
        avatar: "AM",
      },
    }),
    prisma.user.create({
      data: {
        name: "Sarah Chen",
        email: "sarah@company.com",
        role: "manager",
        avatar: "SC",
      },
    }),
    prisma.user.create({
      data: {
        name: "James Wilson",
        email: "james@company.com",
        role: "member",
        avatar: "JW",
      },
    }),
    prisma.user.create({
      data: {
        name: "Emily Davis",
        email: "emily@company.com",
        role: "member",
        avatar: "ED",
      },
    }),
    prisma.user.create({
      data: {
        name: "Michael Brown",
        email: "michael@company.com",
        role: "member",
        avatar: "MB",
      },
    }),
  ]);

  const [alex, sarah, james, emily, michael] = users;

  const websiteProject = await prisma.project.create({
    data: {
      name: "Website Redesign",
      description: "Complete overhaul of the company website with modern UI/UX",
      status: "active",
      priority: "high",
      color: "#2563eb",
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-04-30"),
      members: {
        create: [
          { userId: alex.id, role: "owner" },
          { userId: sarah.id, role: "manager" },
          { userId: james.id, role: "member" },
          { userId: emily.id, role: "member" },
        ],
      },
    },
  });

  const mobileProject = await prisma.project.create({
    data: {
      name: "Mobile App Launch",
      description: "Develop and launch iOS and Android mobile applications",
      status: "active",
      priority: "high",
      color: "#7c3aed",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-06-15"),
      members: {
        create: [
          { userId: sarah.id, role: "owner" },
          { userId: michael.id, role: "member" },
          { userId: james.id, role: "member" },
        ],
      },
    },
  });

  const crmProject = await prisma.project.create({
    data: {
      name: "CRM Integration",
      description: "Integrate Salesforce CRM with internal systems",
      status: "on_hold",
      priority: "medium",
      color: "#0891b2",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-05-30"),
      members: {
        create: [
          { userId: alex.id, role: "owner" },
          { userId: emily.id, role: "member" },
        ],
      },
    },
  });

  const marketingProject = await prisma.project.create({
    data: {
      name: "Q2 Marketing Campaign",
      description: "Plan and execute Q2 digital marketing initiatives",
      status: "active",
      priority: "medium",
      color: "#db2777",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-06-30"),
      members: {
        create: [
          { userId: emily.id, role: "owner" },
          { userId: michael.id, role: "member" },
        ],
      },
    },
  });

  const milestone1 = await prisma.milestone.create({
    data: {
      name: "Design Phase Complete",
      description: "All wireframes and mockups approved",
      dueDate: new Date("2026-02-28"),
      status: "completed",
      projectId: websiteProject.id,
    },
  });

  const milestone2 = await prisma.milestone.create({
    data: {
      name: "Development Sprint 1",
      description: "Core pages and navigation implemented",
      dueDate: new Date("2026-03-31"),
      status: "open",
      projectId: websiteProject.id,
    },
  });

  const milestone3 = await prisma.milestone.create({
    data: {
      name: "Beta Release",
      description: "Internal beta testing begins",
      dueDate: new Date("2026-04-15"),
      status: "open",
      projectId: mobileProject.id,
    },
  });

  const tasks = [
    {
      title: "Create homepage wireframes",
      description: "Design wireframes for the new homepage layout",
      status: "done",
      priority: "high",
      projectId: websiteProject.id,
      assigneeId: emily.id,
      reporterId: sarah.id,
      milestoneId: milestone1.id,
      position: 0,
      dueDate: new Date("2026-02-10"),
    },
    {
      title: "Implement responsive navigation",
      description: "Build mobile-first navigation component",
      status: "in_progress",
      priority: "high",
      projectId: websiteProject.id,
      assigneeId: james.id,
      reporterId: sarah.id,
      milestoneId: milestone2.id,
      position: 0,
      dueDate: new Date("2026-03-20"),
    },
    {
      title: "Set up CI/CD pipeline",
      description: "Configure automated deployment workflow",
      status: "todo",
      priority: "medium",
      projectId: websiteProject.id,
      assigneeId: james.id,
      reporterId: alex.id,
      milestoneId: milestone2.id,
      position: 1,
      dueDate: new Date("2026-03-25"),
    },
    {
      title: "Write API documentation",
      description: "Document all REST API endpoints",
      status: "review",
      priority: "low",
      projectId: websiteProject.id,
      assigneeId: emily.id,
      reporterId: alex.id,
      position: 2,
      dueDate: new Date("2026-03-30"),
    },
    {
      title: "Design app onboarding flow",
      description: "Create user onboarding screens and animations",
      status: "in_progress",
      priority: "high",
      projectId: mobileProject.id,
      assigneeId: emily.id,
      reporterId: sarah.id,
      milestoneId: milestone3.id,
      position: 0,
      dueDate: new Date("2026-04-01"),
    },
    {
      title: "Implement push notifications",
      description: "Set up Firebase push notification service",
      status: "todo",
      priority: "medium",
      projectId: mobileProject.id,
      assigneeId: michael.id,
      reporterId: sarah.id,
      position: 1,
      dueDate: new Date("2026-04-10"),
    },
    {
      title: "Build authentication module",
      description: "OAuth2 and biometric login support",
      status: "todo",
      priority: "urgent",
      projectId: mobileProject.id,
      assigneeId: james.id,
      reporterId: sarah.id,
      position: 2,
      dueDate: new Date("2026-03-15"),
    },
    {
      title: "Map Salesforce data fields",
      description: "Document field mappings between systems",
      status: "todo",
      priority: "medium",
      projectId: crmProject.id,
      assigneeId: emily.id,
      reporterId: alex.id,
      position: 0,
      dueDate: new Date("2026-04-01"),
    },
    {
      title: "Create social media calendar",
      description: "Plan content for April-June",
      status: "in_progress",
      priority: "medium",
      projectId: marketingProject.id,
      assigneeId: michael.id,
      reporterId: emily.id,
      position: 0,
      dueDate: new Date("2026-03-20"),
    },
    {
      title: "Design email templates",
      description: "Create branded email templates for campaigns",
      status: "todo",
      priority: "low",
      projectId: marketingProject.id,
      assigneeId: emily.id,
      reporterId: emily.id,
      position: 1,
      dueDate: new Date("2026-04-05"),
    },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: task });
  }

  const allTasks = await prisma.task.findMany();

  await prisma.timeLog.createMany({
    data: [
      {
        hours: 4,
        description: "Wireframe iterations",
        taskId: allTasks[0].id,
        userId: emily.id,
        date: new Date("2026-02-08"),
      },
      {
        hours: 6,
        description: "Navigation component development",
        taskId: allTasks[1].id,
        userId: james.id,
        date: new Date("2026-03-10"),
      },
      {
        hours: 3,
        description: "API docs draft",
        taskId: allTasks[3].id,
        userId: emily.id,
        date: new Date("2026-03-12"),
      },
      {
        hours: 5,
        description: "Onboarding screen designs",
        taskId: allTasks[4].id,
        userId: emily.id,
        date: new Date("2026-03-08"),
      },
    ],
  });

  await prisma.comment.createMany({
    data: [
      {
        content: "Wireframes look great! Approved for development.",
        taskId: allTasks[0].id,
        userId: sarah.id,
      },
      {
        content: "Need to discuss mobile breakpoint behavior.",
        taskId: allTasks[1].id,
        userId: sarah.id,
      },
      {
        content: "Firebase project created, ready for integration.",
        taskId: allTasks[5].id,
        userId: michael.id,
      },
    ],
  });

  await prisma.activity.createMany({
    data: [
      {
        action: "created project",
        details: "Website Redesign",
        projectId: websiteProject.id,
        userId: alex.id,
      },
      {
        action: "completed task",
        details: "Create homepage wireframes",
        projectId: websiteProject.id,
        userId: emily.id,
      },
      {
        action: "created project",
        details: "Mobile App Launch",
        projectId: mobileProject.id,
        userId: sarah.id,
      },
      {
        action: "updated task",
        details: "Implement responsive navigation → In Progress",
        projectId: websiteProject.id,
        userId: james.id,
      },
      {
        action: "added comment",
        details: "Need to discuss mobile breakpoint behavior",
        projectId: websiteProject.id,
        userId: sarah.id,
      },
      {
        action: "logged time",
        details: "6 hours on navigation component",
        projectId: websiteProject.id,
        userId: james.id,
      },
    ],
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
