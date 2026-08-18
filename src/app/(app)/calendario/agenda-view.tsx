"use client";

import { EmptyState } from "@/components/layout/page-header";
import { cn } from "@/lib/utils/cn";
import { SOURCE_META, type CalendarItem } from "./types";

export function AgendaView({ items }: { items: CalendarItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nada agendado este mes"
        description="Las tareas, cuotas, objetivos y eventos aparecerán acá."
      />
    );
  }

  // agrupar por día
  const groups = new Map<string, CalendarItem[]>();
  for (const it of items) {
    const arr = groups.get(it.event_date) ?? [];
    arr.push(it);
    groups.set(it.event_date, arr);
  }
  const days = Array.from(groups.keys()).sort();
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      {days.map((day) => {
        const d = new Date(day + "T00:00:00");
        const isToday = day === todayIso;
        return (
          <div key={day} className="flex gap-4">
            <div className="w-14 shrink-0 pt-1 text-right">
              <p
                className={cn(
                  "text-lg font-medium tabular-nums",
                  isToday ? "text-accent" : "text-fg"
                )}
              >
                {d.getDate()}
              </p>
              <p className="text-xs text-fg-subtle">
                {new Intl.DateTimeFormat("es-AR", { weekday: "short" }).format(d)}
              </p>
            </div>
            <div className="flex-1 space-y-1.5">
              {groups.get(day)!.map((it) => {
                const meta = SOURCE_META[it.source_type];
                return (
                  <div
                    key={`${it.source_type}-${it.source_id}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
                  >
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", meta.dot)} />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {it.title}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[11px]",
                        meta.chip
                      )}
                    >
                      {meta.label.replace(/s$/, "")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
