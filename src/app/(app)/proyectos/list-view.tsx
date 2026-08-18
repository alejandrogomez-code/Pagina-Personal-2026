"use client";

import { cn } from "@/lib/utils/cn";
import {
  PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type Phase,
  type Task,
} from "./types";

const priorityStyle: Record<Task["priority"], string> = {
  low: "text-fg-subtle",
  medium: "text-fg-muted",
  high: "text-warning",
  urgent: "text-danger font-medium",
};

const statusStyle: Record<Task["status"], string> = {
  todo: "bg-surface-2 text-fg-muted",
  in_progress: "bg-accent-soft text-accent",
  review: "bg-warning/10 text-warning",
  done: "bg-success/10 text-success",
};

export function ListView({
  tasks,
  phases,
  onOpen,
}: {
  tasks: Task[];
  phases: Phase[];
  onOpen: (t: Task) => void;
}) {
  // agrupar por fase; las sin fase van al final
  const groups: { phase: Phase | null; items: Task[] }[] = [
    ...phases.map((ph) => ({
      phase: ph,
      items: tasks.filter((t) => t.phase_id === ph.id),
    })),
    { phase: null, items: tasks.filter((t) => !t.phase_id) },
  ].filter((g) => g.items.length > 0);

  if (tasks.length === 0) {
    return (
      <p className="py-10 text-center text-[13px] text-fg-subtle">
        Sin tareas todavía. Creá la primera con el botón "Tarea".
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.phase?.id ?? "none"}>
          <p className="mb-2 text-[13px] font-medium text-fg-muted">
            {g.phase?.name ?? "Sin fase"}
          </p>
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <ul className="divide-y divide-border">
              {g.items.map((t) => (
                <li
                  key={t.id}
                  onClick={() => onOpen(t)}
                  className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-surface-2"
                >
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px]",
                      statusStyle[t.status]
                    )}
                  >
                    {TASK_STATUS_LABELS[t.status]}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
                  <span className={cn("hidden text-xs sm:inline", priorityStyle[t.priority])}>
                    {PRIORITY_LABELS[t.priority]}
                  </span>
                  {t.due_date && (
                    <span className="text-xs text-fg-subtle tabular-nums">
                      {new Intl.DateTimeFormat("es-AR", {
                        day: "numeric",
                        month: "short",
                      }).format(new Date(t.due_date))}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
