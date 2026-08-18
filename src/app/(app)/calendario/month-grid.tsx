"use client";

import { cn } from "@/lib/utils/cn";
import { SOURCE_META, type CalendarItem } from "./types";

export function MonthGrid({
  period,
  items,
}: {
  period: string;
  items: CalendarItem[];
}) {
  const [y, m] = period.split("-").map(Number);
  const firstDay = new Date(y, m - 1, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(y, m, 0).getDate();
  const todayIso = new Date().toISOString().slice(0, 10);

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const byDay = (day: number) => {
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return items.filter((i) => i.event_date === iso);
  };

  const dow = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
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
          const iso =
            day &&
            `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = iso === todayIso;
          const dayItems = day ? byDay(day) : [];
          return (
            <div
              key={i}
              className={cn(
                "min-h-[96px] border-b border-r border-border p-1.5",
                (i + 1) % 7 === 0 && "border-r-0",
                !day && "bg-surface-2/40"
              )}
            >
              {day && (
                <>
                  <span
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded-full text-xs",
                      isToday
                        ? "bg-accent font-medium text-accent-fg"
                        : "text-fg-subtle"
                    )}
                  >
                    {day}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayItems.slice(0, 3).map((it) => {
                      const meta = SOURCE_META[it.source_type];
                      return (
                        <div
                          key={`${it.source_type}-${it.source_id}`}
                          className={cn(
                            "flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]",
                            meta.chip
                          )}
                          title={it.title}
                        >
                          <span className="truncate">{it.title}</span>
                        </div>
                      );
                    })}
                    {dayItems.length > 3 && (
                      <span className="pl-1 text-[10px] text-fg-subtle">
                        +{dayItems.length - 3} más
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
  );
}
