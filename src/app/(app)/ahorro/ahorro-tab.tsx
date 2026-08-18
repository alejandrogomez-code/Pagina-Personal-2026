"use client";

import { EmptyState } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { createClient } from "@/lib/supabase/client";
import { clampedProgress, formatARS } from "@/lib/utils/format";
import type { SavingsGoal } from "./types";
import { Plus, Trash2, Link2 } from "lucide-react";
import { useEffect, useState } from "react";

interface YearGoal {
  id: string;
  name: string;
  savings_goal_id: string | null;
}

export function AhorroTab({ onMutate }: { onMutate: () => void }) {
  const [goals, setGoals] = useState<SavingsGoal[] | null>(null);
  const [yearGoals, setYearGoals] = useState<YearGoal[]>([]);
  const [modal, setModal] = useState(false);
  const [editAmount, setEditAmount] = useState<SavingsGoal | null>(null);

  async function load() {
    const supabase = createClient();
    const [{ data: s }, { data: y }] = await Promise.all([
      supabase
        .from("savings_goals")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("goals")
        .select("id, name, savings_goal_id")
        .eq("goal_type", "quantitative")
        .is("deleted_at", null),
    ]);
    setGoals((s as SavingsGoal[]) ?? []);
    setYearGoals((y as YearGoal[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    const supabase = createClient();
    await supabase
      .from("savings_goals")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    load();
    onMutate();
  }

  const linkedYearGoal = (savingsId: string) =>
    yearGoals.find((y) => y.savings_goal_id === savingsId);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" size="sm" onClick={() => setModal(true)}>
          <Plus size={15} /> Nuevo objetivo de ahorro
        </Button>
      </div>

      {goals === null ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-border bg-surface-2" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          title="Sin objetivos de ahorro"
          description="Creá metas como un fondo de emergencia y seguí su avance."
          action={
            <Button variant="primary" size="sm" onClick={() => setModal(true)}>
              <Plus size={15} /> Crear objetivo
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((g) => {
            const pct = clampedProgress(Number(g.current_amount), Number(g.target_amount));
            const linked = linkedYearGoal(g.id);
            return (
              <div
                key={g.id}
                className="group rounded-xl border border-border bg-surface p-[var(--card-p)]"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{g.name}</p>
                  <button
                    onClick={() => remove(g.id)}
                    className="text-fg-subtle opacity-0 hover:text-danger group-hover:opacity-100"
                    aria-label="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                  <span className="tabular-nums text-fg-muted">
                    {formatARS(Number(g.current_amount))} / {formatARS(Number(g.target_amount))}
                  </span>
                  <span className="font-medium text-accent">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  {linked ? (
                    <span className="flex items-center gap-1 text-xs text-fg-subtle">
                      <Link2 size={12} /> {linked.name}
                    </span>
                  ) : (
                    <span />
                  )}
                  <button
                    onClick={() => setEditAmount(g)}
                    className="text-[13px] text-accent hover:underline"
                  >
                    Actualizar monto
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <SavingsModal
          yearGoals={yearGoals}
          onClose={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            load();
            onMutate();
          }}
        />
      )}
      {editAmount && (
        <AmountModal
          goal={editAmount}
          onClose={() => setEditAmount(null)}
          onSaved={() => {
            setEditAmount(null);
            load();
            onMutate();
          }}
        />
      )}
    </div>
  );
}

function SavingsModal({
  yearGoals,
  onClose,
  onSaved,
}: {
  yearGoals: YearGoal[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("medium");
  const [linkGoalId, setLinkGoalId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    const t = Number(target.replace(",", "."));
    if (!name.trim()) return setError("Ingresá un nombre.");
    if (!t || t <= 0) return setError("El objetivo debe ser mayor a cero.");
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: created, error } = await supabase
      .from("savings_goals")
      .insert({
        user_id: user!.id,
        name: name.trim(),
        target_amount: t,
        current_amount: Number(current.replace(",", ".")) || 0,
        deadline: deadline || null,
        priority,
        notes: notes || null,
      })
      .select("id")
      .single();

    if (error || !created) {
      setSaving(false);
      return setError("No pudimos guardar el objetivo de ahorro.");
    }

    // vincular con objetivo del año si corresponde
    if (linkGoalId) {
      await supabase
        .from("goals")
        .update({ savings_goal_id: created.id })
        .eq("id", linkGoalId);
      await supabase.rpc("sync_goal_from_savings", { p_savings_id: created.id });
    }
    setSaving(false);
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Nuevo objetivo de ahorro">
      <div className="space-y-3">
        <Field label="Nombre">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Fondo de emergencia"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Importe objetivo">
            <Input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="3000000" />
          </Field>
          <Field label="Importe actual">
            <Input inputMode="decimal" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="0" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha límite">
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
          <Field label="Prioridad">
            <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </Select>
          </Field>
        </div>
        <Field label="Vincular con objetivo del año (opcional)" hint="El avance del objetivo se sincroniza con este ahorro.">
          <Select value={linkGoalId} onChange={(e) => setLinkGoalId(e.target.value)}>
            <option value="">Sin vincular</option>
            {yearGoals
              .filter((y) => !y.savings_goal_id)
              .map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
          </Select>
        </Field>
        <Field label="Notas">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Crear"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AmountModal({
  goal,
  onClose,
  onSaved,
}: {
  goal: SavingsGoal;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [current, setCurrent] = useState(String(goal.current_amount || ""));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    const v = Number(current.replace(",", "."));
    if (Number.isNaN(v) || v < 0) return setError("Importe inválido.");
    setSaving(true);
    const supabase = createClient();
    await supabase.from("savings_goals").update({ current_amount: v }).eq("id", goal.id);
    // si está vinculado a un objetivo del año, sincronizar
    await supabase.rpc("sync_goal_from_savings", { p_savings_id: goal.id });
    setSaving(false);
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title={`Actualizar · ${goal.name}`}>
      <div className="space-y-3">
        <Field label="Importe actual ahorrado">
          <Input
            autoFocus
            inputMode="decimal"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </Field>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
