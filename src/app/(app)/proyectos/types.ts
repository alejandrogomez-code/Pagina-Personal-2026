export type ProjectStatus =
  | "planning"
  | "in_progress"
  | "paused"
  | "completed"
  | "cancelled";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  target_date: string | null;
  status: ProjectStatus;
  priority: Priority;
  notes: string | null;
  objectives_text: string | null;
  sort_order: number;
}

export interface Phase {
  id: string;
  project_id: string;
  name: string;
  sort_order: number;
}

export interface Task {
  id: string;
  project_id: string | null;
  phase_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  start_date: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  notes: string | null;
  sort_order: number;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_done: boolean;
  sort_order: number;
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_id: string;
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planificación",
  in_progress: "En progreso",
  paused: "En pausa",
  completed: "Completado",
  cancelled: "Cancelado",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Pendiente",
  in_progress: "En progreso",
  review: "En revisión",
  done: "Completado",
};

export const TASK_COLUMNS: TaskStatus[] = ["todo", "in_progress", "review", "done"];

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};
