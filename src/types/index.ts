export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "review",
  "done",
] as const;

export const PROJECT_STATUSES = [
  "active",
  "on_hold",
  "completed",
  "archived",
] as const;

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export const MILESTONE_STATUSES = ["pending", "in_progress", "completed"] as const;

export const MEMBER_ROLES = ["owner", "admin", "member", "viewer"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];
export type MemberRole = (typeof MEMBER_ROLES)[number];

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
  jobTitle: string | null;
  department: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  joinedAt: string;
  user?: User;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  color: string;
  ownerId: string;
  startDate: string | null;
  endDate: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  members?: ProjectMember[];
  tasks?: Task[];
  milestones?: Milestone[];
  _count?: {
    tasks: number;
    members: number;
    milestones: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  projectId: string;
  assigneeId: string | null;
  reporterId: string | null;
  milestoneId: string | null;
  dueDate: string | null;
  order: number;
  estimatedHours: number | null;
  createdAt: string;
  updatedAt: string;
  assignee?: User | null;
  reporter?: User | null;
  project?: Project;
  milestone?: Milestone | null;
  comments?: Comment[];
  timeLogs?: TimeLog[];
  _count?: {
    comments: number;
    timeLogs: number;
  };
}

export interface Milestone {
  id: string;
  title: string;
  description: string | null;
  projectId: string;
  dueDate: string | null;
  status: MilestoneStatus;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  tasks?: Task[];
  _count?: {
    tasks: number;
  };
}

export interface TimeLog {
  id: string;
  taskId: string;
  userId: string;
  hours: number;
  description: string | null;
  date: string;
  createdAt: string;
  user?: User;
  task?: Task;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  userId: string;
  projectId: string | null;
  taskId: string | null;
  metadata: string | null;
  createdAt: string;
  user?: User;
  project?: Project | null;
  task?: Task | null;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalUsers: number;
  totalHoursLogged: number;
  recentActivities: Activity[];
  tasksByStatus: Record<string, number>;
  projectsByStatus: Record<string, number>;
}

export interface ApiError {
  error: string;
  details?: string;
}
