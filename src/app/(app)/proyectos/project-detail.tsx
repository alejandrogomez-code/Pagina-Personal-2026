"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { ArrowLeft, List, LayoutGrid, Calendar, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { TaskModal } from "./task-modal";
import { TaskPanel } from "./task-panel";
import { KanbanView } from "./kanban-view";
import { ListView } from "./list-view";
import { CalendarView } from "./calendar-view";
import type { Phase, Project, Task } from "./types";

type View = "list" | "kanban" | "calendar";

export function ProjectDetail({
  project,
  onBack,
}: {
  project: Project;
  onBack: () => void;
}) {
  const [view, setView] = useState<View>("kanban");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [openTask, setOpenTask] = useState<Task | null>(null);

  async function load() {
    const supabase = createClient();
    const [{ data: t }, { data: p }] = await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("project_id", project.id)
        .is("deleted_at", null)
        .order("sort_order"),
      supabase
        .from("project_phases")
        .select("id, project_id, name, sort_order")
        .eq("project_id", project.id)
        .order("sort_order"),
    ]);
    setTasks((t as Task[]) ?? []);
    setPhases((p as Phase[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  async function updateStatus(taskId: string, status: Task["status"]) {
    // optimista
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    const supabase = createClient();
    await supabase.from("tasks").update({ status }).eq("id", taskId);
  }

  const views: { id: View; icon: typeof List; label: string }[] = [
    { id: "list", icon: List, label: "Lista" },
    { id: "kanban", icon: LayoutGrid, label: "Kanban" },
    { id: "calendar", icon: Calendar, label: "Calendario" },
  ];

  return (
    <div className="animate-fade-in">
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-fg"
      >
        <ArrowLeft size={15} /> Volver a proyectos
      </button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium">{project.name}</h1>
          {project.description && (
            <p className="mt-0.5 max-w-lg text-[13px] text-fg-muted">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5">
            {views.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={cn(
                  "grid h-7 w-7 place-items-center rounded",
                  view === v.id ? "bg-accent text-accent-fg" : "text-fg-muted"
                )}
                aria-label={v.label}
                title={v.label}
              >
                <v.icon size={15} />
              </button>
            ))}
          </div>
          <Button variant="primary" size="sm" onClick={() => setModal(true)}>
            <Plus size={15} /> Tarea
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl border border-border bg-surface-2" />
      ) : view === "kanban" ? (
        <KanbanView
          tasks={tasks}
          onOpen={setOpenTask}
          onMove={updateStatus}
        />
      ) : view === "list" ? (
        <ListView tasks={tasks} phases={phases} onOpen={setOpenTask} />
      ) : (
        <CalendarView tasks={tasks} onOpen={setOpenTask} />
      )}

      {modal && (
        <TaskModal
          projectId={project.id}
          phases={phases}
          onClose={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            load();
          }}
        />
      )}
      {openTask && (
        <TaskPanel
          task={openTask}
          phases={phases}
          allTasks={tasks}
          onClose={() => setOpenTask(null)}
          onChanged={() => {
            load();
          }}
          onCloseAndReload={() => {
            setOpenTask(null);
            load();
          }}
        />
      )}
    </div>
  );
}
