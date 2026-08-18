export type GoalType = "quantitative" | "qualitative";
export type GoalStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "paused"
  | "abandoned";
export type Priority = "low" | "medium" | "high" | "urgent";

export interface Goal {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  goal_type: GoalType;
  unit: string | null;
  target: number | null;
  start_date: string | null;
  target_date: string | null;
  status: GoalStatus;
  priority: Priority;
  notes: string | null;
}

export interface GoalCategory {
  id: string;
  name: string;
}

export interface GoalProgress {
  id: string;
  entry_date: string;
  amount: number;
  note: string | null;
}

export interface GoalMilestone {
  id: string;
  label: string;
  target_value: number | null;
  is_done: boolean;
  sort_order: number;
}

export const STATUS_LABELS: Record<GoalStatus, string> = {
  not_started: "No iniciado",
  in_progress: "En progreso",
  completed: "Completado",
  paused: "Pausado",
  abandoned: "Abandonado",
};

export const UNIT_OPTIONS = [
  "veces",
  "cantidad",
  "ARS",
  "%",
  "horas",
  "km",
  "libros",
  "cursos",
  "personalizado",
];
