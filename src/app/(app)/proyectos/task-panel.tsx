"use client";

import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import {
  TASK_STATUS_LABELS,
  type Phase,
  type Subtask,
  type Task,
  type TaskStatus,
} from "./types";
import { AlertTriangle, Check, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export function TaskPanel({
  task,
  phases,
  allTasks,
  onClose,
  onChanged,
  onCloseAndReload,
}: {
  task: Task;
  phases: Phase[];
  allTasks: Task[];
  onClose: () => void;
  onChanged: () => void;
  onCloseAndReload: () => void;
}) {
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [deps, setDeps] = useState<string[]>([]);
  const [newSub, setNewSub] = useState("");
  const [addingDep, setAddingDep] = useState(false);

  async function load() {
    const supabase = createClient();
    const [{ data: s }, { data: d }] = await Promise.all([
      supabase
        .from("subtasks")
        .select("id, task_id, title, is_done, sort_order")
        .eq("task_id", task.id)
        .order("sort_order"),
      supabase
        .from("task_dependencies")
        .select("depends_on_id")
        .eq("task_id", task.id),
    ]);
    setSubtasks((s as Subtask[]) ?? []);
    setDeps((d ?? []).map((x) => x.depends_on_id));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  const done = subtasks.filter((s) => s.is_done).length;
  const pct = subtasks.length ? Math.round((done / subtasks.length) * 100) : null;

  // dependencias incompletas
  const depTasks = allTasks.filter((t) => deps.includes(t.id));
  const pendingDeps = depTasks.filter((t) => t.status !== "done");

  async function changeStatus(s: TaskStatus) {
    setStatus(s);
    const supabase = createClient();
    await supabase.from("tasks").update({ status: s }).eq("id", task.id);
    onChanged();
  }

  async function addSub() {
    if (!newSub.trim()) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("subtasks").insert({
      user_id: user!.id,
      task_id: task.id,
      title: newSub.trim(),
      sort_order: subtasks.length,
    });
    setNewSub("");
    load();
  }

  async function toggleSub(s: Subtask) {
    const supabase = createClient();
    await supabase.from("subtasks").update({ is_done: !s.is_done }).eq("id", s.id);
    load();
  }

  async function removeSub(id: string) {
    const supabase = createClient();
    await supabase.from("subtasks").delete().eq("id", id);
    load();
  }

  async function addDep(dependsOnId: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("task_dependencies").insert({
      user_id: user!.id,
      task_id: task.id,
      depends_on_id: dependsOnId,
    });
    setAddingDep(false);
    load();
  }

  async function removeDep(dependsOnId: string) {
    const supabase = createClient();
    await supabase
      .from("task_dependencies")
      .delete()
      .eq("task_id", task.id)
      .eq("depends_on_id", dependsOnId);
    load();
  }

  async function removeTask() {
    const supabase = createClient();
    await supabase
      .from("tasks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", task.id);
    onCloseAndReload();
  }

  const candidateDeps = allTasks.filter(
    (t) => t.id !== task.id && !deps.includes(t.id)
  );

  return (
    <Modal open onClose={onClose} title={task.title} className="sm:max-w-lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Estado">
            <Select value={status} onChange={(e) => changeStatus(e.target.value as TaskStatus)}>
              {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((s) => (
                <option key={s} value={s}>
                  {TASK_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fase">
            <span className="flex h-9 items-center text-sm text-fg-muted">
              {phases.find((p) => p.id === task.phase_id)?.name ?? "Sin fase"}
            </span>
          </Field>
        </div>

        {pendingDeps.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-[13px] text-warning">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>
              Depende de {pendingDeps.map((t) => `"${t.title}"`).join(", ")}, que
              todavía no está completa.
            </span>
          </div>
        )}

        {/* Subtareas */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">
              Subtareas{pct !== null && <span className="ml-2 text-accent">{pct}%</span>}
            </p>
          </div>
          {subtasks.length > 0 && (
            <div className="mb-2 h-1.5 rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${pct ?? 0}%` }}
              />
            </div>
          )}
          <ul className="space-y-1">
            {subtasks.map((s) => (
              <li key={s.id} className="group flex items-center gap-2.5">
                <button
                  onClick={() => toggleSub(s)}
                  className={cn(
                    "grid h-4 w-4 shrink-0 place-items-center rounded border",
                    s.is_done
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border-strong"
                  )}
                  aria-label={s.is_done ? "Desmarcar" : "Marcar"}
                >
                  {s.is_done && <Check size={11} />}
                </button>
                <span
                  className={cn(
                    "flex-1 text-[13px]",
                    s.is_done && "text-fg-subtle line-through"
                  )}
                >
                  {s.title}
                </span>
                <button
                  onClick={() => removeSub(s.id)}
                  className="text-fg-subtle opacity-0 hover:text-danger group-hover:opacity-100"
                  aria-label="Eliminar subtarea"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <Input
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSub()}
              placeholder="Nueva subtarea"
              className="h-8"
            />
            <Button variant="secondary" size="sm" onClick={addSub}>
              <Plus size={14} />
            </Button>
          </div>
        </div>

        {/* Dependencias */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Depende de</p>
            {candidateDeps.length > 0 && (
              <button
                onClick={() => setAddingDep((v) => !v)}
                className="text-[13px] text-accent hover:underline"
              >
                {addingDep ? "Cancelar" : "Agregar"}
              </button>
            )}
          </div>
          {addingDep && (
            <Select
              className="mb-2"
              defaultValue=""
              onChange={(e) => e.target.value && addDep(e.target.value)}
            >
              <option value="">Elegir tarea…</option>
              {candidateDeps.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Select>
          )}
          {depTasks.length === 0 ? (
            <p className="text-[13px] text-fg-subtle">Sin dependencias.</p>
          ) : (
            <ul className="space-y-1">
              {depTasks.map((t) => (
                <li
                  key={t.id}
                  className="group flex items-center gap-2 text-[13px]"
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      t.status === "done" ? "bg-success" : "bg-warning"
                    )}
                  />
                  <span className="flex-1">{t.title}</span>
                  <span className="text-xs text-fg-subtle">
                    {TASK_STATUS_LABELS[t.status]}
                  </span>
                  <button
                    onClick={() => removeDep(t.id)}
                    className="text-fg-subtle opacity-0 hover:text-danger group-hover:opacity-100"
                    aria-label="Quitar dependencia"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-between border-t border-border pt-3">
          <Button variant="ghost" size="sm" onClick={removeTask}>
            <Trash2 size={14} /> Eliminar tarea
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
