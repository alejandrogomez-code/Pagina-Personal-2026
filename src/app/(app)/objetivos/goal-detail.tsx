"use client";

import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { clampedProgress, formatNumber } from "@/lib/utils/format";
import { todayIso } from "@/lib/utils/period";
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  STATUS_LABELS,
  type Goal,
  type GoalCategory,
  type GoalMilestone,
  type GoalProgress,
  type GoalStatus,
} from "./types";

export function GoalDetail({
  goal: initialGoal,
  categories,
  onBack,
}: {
  goal: Goal;
  categories: GoalCategory[];
  onBack: () => void;
}) {
  const [goal, setGoal] = useState(initialGoal);
  const [entries, setEntries] = useState<GoalProgress[]>([]);
  const [milestones, setMilestones] = useState<GoalMilestone[]>([]);
  const [addProgress, setAddProgress] = useState(false);
  const [addMilestone, setAddMilestone] = useState(false);

  const isQuant = goal.goal_type === "quantitative";
  const current = entries.reduce((a, e) => a + Number(e.amount), 0);
  const target = Number(goal.target ?? 0);
  const pct = clampedProgress(current, target);

  async function load() {
    const supabase = createClient();
    const [{ data: p }, { data: m }] = await Promise.all([
      supabase
        .from("goal_progress")
        .select("id, entry_date, amount, note")
        .eq("goal_id", goal.id)
        .order("entry_date", { ascending: false }),
      supabase
        .from("goal_milestones")
        .select("id, label, target_value, is_done, sort_order")
        .eq("goal_id", goal.id)
        .order("sort_order"),
    ]);
    setEntries((p as GoalProgress[]) ?? []);
    setMilestones((m as GoalMilestone[]) ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal.id]);

  async function changeStatus(status: GoalStatus) {
    const supabase = createClient();
    await supabase.from("goals").update({ status }).eq("id", goal.id);
    setGoal({ ...goal, status });
  }

  async function removeEntry(id: string) {
    const supabase = createClient();
    await supabase.from("goal_progress").delete().eq("id", id);
    load();
  }

  async function toggleMilestone(m: GoalMilestone) {
    const supabase = createClient();
    await supabase
      .from("goal_milestones")
      .update({ is_done: !m.is_done })
      .eq("id", m.id);
    load();
  }

  return (
    <div className="animate-fade-in">
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-fg"
      >
        <ArrowLeft size={15} /> Volver a objetivos
      </button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium">{goal.name}</h1>
          <p className="mt-0.5 text-[13px] text-fg-muted">
            {categories.find((c) => c.id === goal.category_id)?.name ?? "Sin categoría"}
            {goal.target_date &&
              ` · vence ${new Intl.DateTimeFormat("es-AR", {
                day: "numeric",
                month: "long",
              }).format(new Date(goal.target_date))}`}
          </p>
        </div>
        <Select
          value={goal.status}
          onChange={(e) => changeStatus(e.target.value as GoalStatus)}
          className="w-auto"
        >
          {(Object.keys(STATUS_LABELS) as GoalStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>

      {isQuant && (
        <div className="mb-5 rounded-xl border border-border bg-surface p-[var(--card-p)]">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-2xl font-medium tabular-nums">
              {formatNumber(current)}
              <span className="text-base text-fg-subtle"> / {formatNumber(target)}</span>
              {goal.unit && goal.unit !== "ARS" && goal.unit !== "personalizado" && (
                <span className="ml-1 text-sm text-fg-muted">{goal.unit}</span>
              )}
            </span>
            <span className="text-lg font-medium text-accent">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[13px] text-fg-muted">
              {current >= target && target > 0
                ? `Completado · +${formatNumber(current - target)} adicional`
                : `Faltan ${formatNumber(Math.max(0, target - current))}`}
            </p>
            <Button variant="secondary" size="sm" onClick={() => setAddProgress(true)}>
              <Plus size={15} /> Registrar avance
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Historial de avances */}
        {isQuant && (
          <div className="rounded-xl border border-border bg-surface p-[var(--card-p)]">
            <p className="mb-3 text-sm font-medium">Historial</p>
            {entries.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-fg-subtle">
                Todavía no registraste avances.
              </p>
            ) : (
              <ul className="space-y-1">
                {entries.map((e) => (
                  <li
                    key={e.id}
                    className="group flex items-center justify-between rounded px-2 py-1.5 text-[13px] hover:bg-surface-2"
                  >
                    <span className="text-fg-muted">
                      {new Intl.DateTimeFormat("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                      }).format(new Date(e.entry_date))}
                      {e.note && <span className="ml-2 text-fg-subtle">{e.note}</span>}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-medium tabular-nums text-success">
                        +{formatNumber(Number(e.amount))}
                      </span>
                      <button
                        onClick={() => removeEntry(e.id)}
                        className="text-fg-subtle opacity-0 hover:text-danger group-hover:opacity-100"
                        aria-label="Eliminar avance"
                      >
                        <Trash2 size={13} />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Submetas */}
        <div className="rounded-xl border border-border bg-surface p-[var(--card-p)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">Submetas</p>
            <button
              onClick={() => setAddMilestone(true)}
              className="text-[13px] text-accent hover:underline"
            >
              Agregar
            </button>
          </div>
          {milestones.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-fg-subtle">
              Dividí el objetivo en pasos.
            </p>
          ) : (
            <ul className="space-y-1">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-center gap-2.5 py-1">
                  <button
                    onClick={() => toggleMilestone(m)}
                    className={cn(
                      "grid h-4 w-4 shrink-0 place-items-center rounded border",
                      m.is_done
                        ? "border-accent bg-accent text-accent-fg"
                        : "border-border-strong"
                    )}
                    aria-label={m.is_done ? "Marcar pendiente" : "Marcar hecho"}
                  >
                    {m.is_done && <Check size={11} />}
                  </button>
                  <span
                    className={cn(
                      "flex-1 text-[13px]",
                      m.is_done && "text-fg-subtle line-through"
                    )}
                  >
                    {m.label}
                  </span>
                  {m.target_value != null && (
                    <span className="text-xs tabular-nums text-fg-subtle">
                      {formatNumber(Number(m.target_value))}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {addProgress && (
        <ProgressModal
          goalId={goal.id}
          onClose={() => setAddProgress(false)}
          onSaved={() => {
            setAddProgress(false);
            load();
          }}
        />
      )}
      {addMilestone && (
        <MilestoneModal
          goalId={goal.id}
          nextOrder={milestones.length}
          onClose={() => setAddMilestone(false)}
          onSaved={() => {
            setAddMilestone(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function ProgressModal({
  goalId,
  onClose,
  onSaved,
}: {
  goalId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("1");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    const v = Number(amount.replace(",", "."));
    if (!v || v === 0) return setError("Ingresá una cantidad.");
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("goal_progress").insert({
      user_id: user!.id,
      goal_id: goalId,
      entry_date: date,
      amount: v,
      note: note || null,
    });
    setSaving(false);
    if (error) return setError("No pudimos guardar el avance.");
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Registrar avance">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cantidad">
            <Input
              autoFocus
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field label="Fecha">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Nota (opcional)">
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Registrar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function MilestoneModal({
  goalId,
  nextOrder,
  onClose,
  onSaved,
}: {
  goalId: string;
  nextOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    if (!label.trim()) return setError("Ingresá un nombre para la submeta.");
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("goal_milestones").insert({
      user_id: user!.id,
      goal_id: goalId,
      label: label.trim(),
      target_value: targetValue ? Number(targetValue.replace(",", ".")) : null,
      sort_order: nextOrder,
    });
    setSaving(false);
    if (error) return setError("No pudimos guardar la submeta.");
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Nueva submeta">
      <div className="space-y-3">
        <Field label="Descripción">
          <Input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Llegar a $500.000"
          />
        </Field>
        <Field label="Valor objetivo (opcional)">
          <Input
            inputMode="decimal"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            placeholder="500000"
          />
        </Field>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Agregar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
