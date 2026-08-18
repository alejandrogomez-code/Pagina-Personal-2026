export type SourceType =
  | "task"
  | "goal"
  | "card_installment"
  | "reminder"
  | "event";

export interface CalendarItem {
  source_type: SourceType;
  source_id: string;
  title: string;
  event_date: string;
  meta: string | null;
}

export const SOURCE_META: Record<
  SourceType,
  { label: string; dot: string; chip: string }
> = {
  task: {
    label: "Tareas",
    dot: "bg-accent",
    chip: "bg-accent-soft text-accent",
  },
  goal: {
    label: "Objetivos",
    dot: "bg-success",
    chip: "bg-success/10 text-success",
  },
  card_installment: {
    label: "Cuotas",
    dot: "bg-warning",
    chip: "bg-warning/10 text-warning",
  },
  reminder: {
    label: "Recordatorios",
    dot: "bg-[hsl(250_50%_65%)]",
    chip: "bg-[hsl(250_50%_65%)]/10 text-[hsl(250_50%_60%)]",
  },
  event: {
    label: "Eventos",
    dot: "bg-fg-muted",
    chip: "bg-surface-2 text-fg-muted",
  },
};
