export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  startDate: string | null;
  endDate: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
  _count?: { tasks: number; members: number; milestones: number };
  members?: ProjectMember[];
  tasks?: Task[];
  milestones?: Milestone[];
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  user?: User;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  position: number;
  projectId: string;
  assigneeId: string | null;
  reporterId: string | null;
  milestoneId: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: User | null;
  reporter?: User | null;
  project?: Project;
  milestone?: Milestone | null;
  _count?: { comments: number; timeLogs: number };
}

export interface Milestone {
  id: string;
  name: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  projectId: string;
  createdAt: string;
  project?: Project;
  _count?: { tasks: number };
  tasks?: Task[];
}

export interface TimeLog {
  id: string;
  hours: number;
  description: string | null;
  date: string;
  taskId: string;
  userId: string;
  task?: Task & { project?: Project };
  user?: User;
}

export interface Activity {
  id: string;
  action: string;
  details: string | null;
  projectId: string | null;
  userId: string;
  createdAt: string;
  user?: User;
  project?: Project | null;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalHours: number;
  teamMembers: number;
}

export const TASK_STATUSES = [
  { value: "todo", label: "To Do", color: "bg-slate-100 border-slate-300" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-50 border-blue-300" },
  { value: "review", label: "Review", color: "bg-purple-50 border-purple-300" },
  { value: "done", label: "Done", color: "bg-emerald-50 border-emerald-300" },
] as const;

export const PROJECT_STATUSES = [
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
] as const;

export const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;
