"use client";

import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { createClient } from "@/lib/supabase/client";
import type { Phase } from "./types";
import { useState } from "react";

export function TaskModal({
  projectId,
  phases,
  onClose,
  onSaved,
}: {
  projectId: string;
  phases: Phase[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [phaseId, setPhaseId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    if (!title.trim()) return setError("Ingresá un título.");
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("tasks").insert({
      user_id: user!.id,
      project_id: projectId,
      phase_id: phaseId || null,
      title: title.trim(),
      priority,
      due_date: dueDate || null,
      status: "todo",
    });
    setSaving(false);
    if (error) return setError("No pudimos guardar la tarea.");
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Nueva tarea">
      <div className="space-y-3">
        <Field label="Título">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Revisar plan de cuentas"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fase">
            <Select value={phaseId} onChange={(e) => setPhaseId(e.target.value)}>
              <option value="">Sin fase</option>
              {phases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
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
        <Field label="Fecha límite">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Crear tarea"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
