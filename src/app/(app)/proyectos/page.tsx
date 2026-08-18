"use client";

import { EmptyState, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { Plus, Briefcase } from "lucide-react";
import { useEffect, useState } from "react";
import { ProjectModal } from "./project-modal";
import { ProjectDetail } from "./project-detail";
import { PROJECT_STATUS_LABELS, type Project } from "./types";

export default function ProyectosPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [counts, setCounts] = useState<Record<string, { total: number; done: number }>>({});
  const [modal, setModal] = useState(false);
  const [open, setOpen] = useState<Project | null>(null);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("projects")
      .select("*")
      .is("deleted_at", null)
      .order("sort_order")
      .order("created_at", { ascending: false });
    const list = (data as Project[]) ?? [];
    setProjects(list);

    const ids = list.map((p) => p.id);
    if (ids.length) {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("project_id, status")
        .is("deleted_at", null)
        .in("project_id", ids);
      const acc: Record<string, { total: number; done: number }> = {};
      for (const t of tasks ?? []) {
        if (!t.project_id) continue;
        acc[t.project_id] ??= { total: 0, done: 0 };
        acc[t.project_id].total++;
        if (t.status === "done") acc[t.project_id].done++;
      }
      setCounts(acc);
    } else setCounts({});
  }

  useEffect(() => {
    load();
  }, []);

  if (open) {
    return (
      <ProjectDetail
        project={open}
        onBack={() => {
          setOpen(null);
          load();
        }}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Proyectos"
        subtitle="Contabilidad, Desarrollo de Fondos y más"
        action={
          <Button variant="primary" size="sm" onClick={() => setModal(true)}>
            <Plus size={15} /> Nuevo proyecto
          </Button>
        }
      />

      {projects === null ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-border bg-surface-2" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="Todavía no tenés proyectos"
          description="Creá tu primer proyecto y organizalo en fases y tareas."
          action={
            <Button variant="primary" size="sm" onClick={() => setModal(true)}>
              <Plus size={15} /> Crear proyecto
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const c = counts[p.id] ?? { total: 0, done: 0 };
            const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
            return (
              <button
                key={p.id}
                onClick={() => setOpen(p)}
                className="flex flex-col rounded-xl border border-border bg-surface p-[var(--card-p)] text-left transition-colors hover:border-border-strong"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-fg-muted">
                    <Briefcase size={16} />
                  </div>
                  <StatusPill status={p.status} />
                </div>
                <p className="text-sm font-medium">{p.name}</p>
                {p.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-fg-subtle">{p.description}</p>
                )}
                <div className="mt-auto pt-3">
                  <div className="mb-1 flex justify-between text-xs text-fg-muted">
                    <span>{c.done}/{c.total} tareas</span>
                    <span className="text-accent">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {modal && (
        <ProjectModal
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

function StatusPill({ status }: { status: Project["status"] }) {
  const styles: Record<Project["status"], string> = {
    planning: "bg-surface-2 text-fg-muted",
    in_progress: "bg-accent-soft text-accent",
    paused: "bg-warning/10 text-warning",
    completed: "bg-success/10 text-success",
    cancelled: "bg-surface-2 text-fg-subtle line-through",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px]", styles[status])}>
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}
