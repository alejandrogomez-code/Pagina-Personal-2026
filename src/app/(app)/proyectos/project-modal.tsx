"use client";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export function ProjectModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [withPhases, setWithPhases] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    if (!name.trim()) return setError("Ingresá un nombre.");
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: created, error } = await supabase
      .from("projects")
      .insert({
        user_id: user!.id,
        name: name.trim(),
        description: description || null,
        target_date: targetDate || null,
        priority,
        status: "in_progress",
      })
      .select("id")
      .single();

    if (error || !created) {
      setSaving(false);
      return setError("No pudimos guardar el proyecto.");
    }

    if (withPhases) {
      const fases = ["Inicio", "Relevamiento", "Diseño", "Implementación", "Seguimiento", "Cierre"];
      await supabase.from("project_phases").insert(
        fases.map((f, i) => ({
          user_id: user!.id,
          project_id: created.id,
          name: f,
          sort_order: i,
        }))
      );
    }
    setSaving(false);
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Nuevo proyecto">
      <div className="space-y-3">
        <Field label="Nombre">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contabilidad"
          />
        </Field>
        <Field label="Descripción">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha objetivo">
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
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
        <label className="flex items-center gap-2 text-[13px] text-fg-muted">
          <input
            type="checkbox"
            checked={withPhases}
            onChange={(e) => setWithPhases(e.target.checked)}
            className="h-4 w-4 rounded border-border-strong accent-[hsl(var(--accent))]"
          />
          Crear fases sugeridas (Inicio → Cierre)
        </label>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Crear proyecto"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
