"use client";

import { EmptyState, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { clampedProgress } from "@/lib/utils/format";
import { LayoutGrid, List, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { GoalCard } from "./goal-card";
import { GoalModal } from "./goal-modal";
import { GoalDetail } from "./goal-detail";
import type { Goal, GoalCategory } from "./types";

type Filtro = "todos" | "in_progress" | "completed" | "pending" | "atrasados";

export default function ObjetivosPage() {
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [cats, setCats] = useState<GoalCategory[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [view, setView] = useState<"cards" | "list">("cards");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [modal, setModal] = useState(false);
  const [openGoal, setOpenGoal] = useState<Goal | null>(null);

  async function load() {
    const supabase = createClient();
    const [{ data: g }, { data: c }] = await Promise.all([
      supabase.from("goals").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("goal_categories").select("id, name"),
    ]);
    const list = (g as Goal[]) ?? [];
    setGoals(list);
    setCats((c as GoalCategory[]) ?? []);

    const ids = list.map((x) => x.id);
    if (ids.length) {
      const { data: prog } = await supabase
        .from("goal_progress")
        .select("goal_id, amount")
        .in("goal_id", ids);
      const acc: Record<string, number> = {};
      for (const p of prog ?? []) acc[p.goal_id] = (acc[p.goal_id] ?? 0) + Number(p.amount);
      setProgress(acc);
    } else {
      setProgress({});
    }
  }

  useEffect(() => {
    load();
  }, []);

  const hoy = new Date().toISOString().slice(0, 10);
  const filtered = (goals ?? []).filter((g) => {
    if (filtro === "todos") return true;
    if (filtro === "in_progress") return g.status === "in_progress";
    if (filtro === "completed") return g.status === "completed";
    if (filtro === "pending") return g.status === "not_started";
    if (filtro === "atrasados")
      return g.status !== "completed" && g.target_date != null && g.target_date < hoy;
    return true;
  });

  if (openGoal) {
    return (
      <GoalDetail
        goal={openGoal}
        categories={cats}
        onBack={() => {
          setOpenGoal(null);
          load();
        }}
      />
    );
  }

  const filtros: { id: Filtro; label: string }[] = [
    { id: "todos", label: "Todos" },
    { id: "in_progress", label: "En progreso" },
    { id: "completed", label: "Completados" },
    { id: "pending", label: "Pendientes" },
    { id: "atrasados", label: "Atrasados" },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Objetivos del Año"
        subtitle="Lo que querés alcanzar este año"
        action={
          <Button variant="primary" size="sm" onClick={() => setModal(true)}>
            <Plus size={15} /> Nuevo objetivo
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {filtros.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-[13px] transition-colors",
                filtro === f.id
                  ? "border-accent bg-accent-soft text-fg"
                  : "border-border text-fg-muted hover:text-fg"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-border p-0.5">
          <button
            onClick={() => setView("cards")}
            className={cn(
              "grid h-7 w-7 place-items-center rounded",
              view === "cards" ? "bg-accent text-accent-fg" : "text-fg-muted"
            )}
            aria-label="Vista tarjetas"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "grid h-7 w-7 place-items-center rounded",
              view === "list" ? "bg-accent text-accent-fg" : "text-fg-muted"
            )}
            aria-label="Vista lista"
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {goals === null ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl border border-border bg-surface-2" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Todavía no tenés objetivos"
          description="Creá tu primer objetivo del año, cuantitativo o cualitativo."
          action={
            <Button variant="primary" size="sm" onClick={() => setModal(true)}>
              <Plus size={15} /> Crear mi primer objetivo
            </Button>
          }
        />
      ) : view === "cards" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              current={progress[g.id] ?? 0}
              category={cats.find((c) => c.id === g.category_id)?.name}
              onClick={() => setOpenGoal(g)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <ul className="divide-y divide-border">
            {filtered.map((g) => {
              const pct = clampedProgress(progress[g.id] ?? 0, Number(g.target ?? 0));
              return (
                <li
                  key={g.id}
                  onClick={() => setOpenGoal(g)}
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-surface-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{g.name}</p>
                    <p className="text-xs text-fg-subtle">
                      {cats.find((c) => c.id === g.category_id)?.name ?? "Sin categoría"}
                    </p>
                  </div>
                  {g.goal_type === "quantitative" && (
                    <div className="flex w-32 items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-9 text-right text-xs text-accent tabular-nums">{pct}%</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {modal && (
        <GoalModal
          categories={cats}
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
