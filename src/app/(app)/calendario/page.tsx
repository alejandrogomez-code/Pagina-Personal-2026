"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { addMonths, monthLabel, monthStart } from "@/lib/utils/period";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, List } from "lucide-react";
import { useEffect, useState } from "react";
import { EventModal } from "./event-modal";
import { MonthGrid } from "./month-grid";
import { AgendaView } from "./agenda-view";
import { SOURCE_META, type CalendarItem, type SourceType } from "./types";

const ALL_TYPES: SourceType[] = [
  "task",
  "goal",
  "card_installment",
  "reminder",
  "event",
];

export default function CalendarioPage() {
  const [period, setPeriod] = useState(monthStart());
  const [view, setView] = useState<"month" | "agenda">("month");
  const [items, setItems] = useState<CalendarItem[] | null>(null);
  const [active, setActive] = useState<Set<SourceType>>(new Set(ALL_TYPES));
  const [modal, setModal] = useState(false);

  async function load() {
    const supabase = createClient();
    const start = period;
    const end = addMonths(period, 1);
    const { data } = await supabase
      .from("calendar_feed")
      .select("source_type, source_id, title, event_date, meta")
      .gte("event_date", start)
      .lt("event_date", end)
      .order("event_date");
    setItems((data as CalendarItem[]) ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  function toggle(t: SourceType) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  const filtered = (items ?? []).filter((i) => active.has(i.source_type));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Calendario"
        subtitle="Tareas, vencimientos, cuotas y objetivos, todo junto"
        action={
          <Button variant="primary" size="sm" onClick={() => setModal(true)}>
            <Plus size={15} /> Evento
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPeriod(addMonths(period, -1))}
            className="grid h-8 w-8 place-items-center rounded border border-border text-fg-muted hover:bg-surface-2"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[140px] text-center text-sm font-medium">
            {monthLabel(period)}
          </span>
          <button
            onClick={() => setPeriod(addMonths(period, 1))}
            className="grid h-8 w-8 place-items-center rounded border border-border text-fg-muted hover:bg-surface-2"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setPeriod(monthStart())}
            className="ml-1 rounded border border-border px-2.5 py-1.5 text-[13px] text-fg-muted hover:bg-surface-2"
          >
            Hoy
          </button>
        </div>

        <div className="flex rounded-lg border border-border p-0.5">
          <button
            onClick={() => setView("month")}
            className={cn(
              "grid h-7 w-7 place-items-center rounded",
              view === "month" ? "bg-accent text-accent-fg" : "text-fg-muted"
            )}
            aria-label="Vista mes"
          >
            <CalendarDays size={15} />
          </button>
          <button
            onClick={() => setView("agenda")}
            className={cn(
              "grid h-7 w-7 place-items-center rounded",
              view === "agenda" ? "bg-accent text-accent-fg" : "text-fg-muted"
            )}
            aria-label="Vista agenda"
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Filtros por tipo */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {ALL_TYPES.map((t) => {
          const on = active.has(t);
          const meta = SOURCE_META[t];
          return (
            <button
              key={t}
              onClick={() => toggle(t)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[13px] transition-colors",
                on
                  ? "border-border-strong text-fg"
                  : "border-border text-fg-subtle opacity-60"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
              {meta.label}
            </button>
          );
        })}
      </div>

      {items === null ? (
        <div className="h-96 animate-pulse rounded-xl border border-border bg-surface-2" />
      ) : view === "month" ? (
        <MonthGrid period={period} items={filtered} />
      ) : (
        <AgendaView items={filtered} />
      )}

      {modal && (
        <EventModal
          defaultPeriod={period}
          onClose={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}
