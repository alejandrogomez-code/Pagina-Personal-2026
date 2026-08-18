"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { addMonths, monthLabel, monthStart } from "@/lib/utils/period";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { Task } from "./types";

const priorityDot: Record<Task["priority"], string> = {
  low: "bg-fg-subtle",
  medium: "bg-accent",
  high: "bg-warning",
  urgent: "bg-danger",
};

export function CalendarView({
  tasks,
  onOpen,
}: {
  tasks: Task[];
  onOpen: (t: Task) => void;
}) {
  const [period, setPeriod] = useState(monthStart());
  const [y, m] = period.split("-").map(Number);

  const firstDay = new Date(y, m - 1, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(y, m, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const tasksByDay = (day: number) => {
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return tasks.filter((t) => t.due_date === iso);
  };

  const dow = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium">{monthLabel(period)}</span>
        <div className="flex gap-1">
          <button
            onClick={() => setPeriod(addMonths(period, -1))}
            className="grid h-8 w-8 place-items-center rounded border border-border text-fg-muted hover:bg-surface-2"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setPeriod(addMonths(period, 1))}
            className="grid h-8 w-8 place-items-center rounded border border-border text-fg-muted hover:bg-surface-2"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-7 border-b border-border bg-surface-2 text-center text-xs text-fg-muted">
          {dow.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dayTasks = day ? tasksByDay(day) : [];
            return (
              <div
                key={i}
                className={cn(
                  "min-h-[84px] border-b border-r border-border p-1.5",
                  (i + 1) % 7 === 0 && "border-r-0",
                  !day && "bg-surface-2/40"
                )}
              >
                {day && (
                  <>
                    <span className="text-xs text-fg-subtle">{day}</span>
                    <div className="mt-1 space-y-1">
                      {dayTasks.slice(0, 3).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => onOpen(t)}
                          className="flex w-full items-center gap-1 rounded bg-surface-2 px-1.5 py-1 text-left"
                        >
                          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", priorityDot[t.priority])} />
                          <span className="truncate text-[11px]">{t.title}</span>
                        </button>
                      ))}
                      {dayTasks.length > 3 && (
                        <span className="pl-1 text-[10px] text-fg-subtle">
                          +{dayTasks.length - 3} más
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
