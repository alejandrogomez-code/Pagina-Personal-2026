"use client";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { UNIT_OPTIONS, type GoalCategory, type GoalType } from "./types";
import { useState } from "react";

export function GoalModal({
  categories,
  onClose,
  onSaved,
}: {
  categories: GoalCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<GoalType>("quantitative");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("veces");
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    if (!name.trim()) return setError("Ingresá un nombre.");
    if (type === "quantitative") {
      const t = Number(target.replace(",", "."));
      if (!t || t <= 0) return setError("La meta debe ser mayor a cero.");
    }
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("goals").insert({
      user_id: user!.id,
      name: name.trim(),
      description: description || null,
      goal_type: type,
      category_id: categoryId || null,
      target: type === "quantitative" ? Number(target.replace(",", ".")) : null,
      unit: type === "quantitative" ? unit : null,
      target_date: targetDate || null,
      priority,
      status: "in_progress",
    });
    setSaving(false);
    if (error) return setError("No pudimos guardar el objetivo.");
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Nuevo objetivo">
      <div className="space-y-3">
        <div className="flex rounded-lg border border-border p-0.5">
          {(["quantitative", "qualitative"] as GoalType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-[13px] transition-colors",
                type === t ? "bg-accent text-accent-fg" : "text-fg-muted"
              )}
            >
              {t === "quantitative" ? "Cuantitativo" : "Cualitativo"}
            </button>
          ))}
        </div>

        <Field label="Nombre">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === "quantitative" ? "Leer 24 libros" : "Aprender a tocar guitarra"}
          />
        </Field>

        {type === "quantitative" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Meta">
              <Input
                inputMode="decimal"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="24"
              />
            </Field>
            <Field label="Unidad">
              <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoría">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha objetivo">
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Prioridad">
          <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </Select>
        </Field>

        {type === "qualitative" && (
          <Field label="Descripción">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Qué querés lograr y cómo lo medís"
            />
          </Field>
        )}

        {error && <p className="text-[13px] text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Crear objetivo"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
