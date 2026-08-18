"use client";

import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { todayIso } from "@/lib/utils/period";
import { useState } from "react";

export function EventModal({
  defaultPeriod,
  onClose,
  onSaved,
}: {
  defaultPeriod: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [kind, setKind] = useState<"event" | "reminder">("event");
  const [title, setTitle] = useState("");
  const defaultDate =
    todayIso().slice(0, 7) === defaultPeriod.slice(0, 7) ? todayIso() : defaultPeriod;
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("");
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

    let error;
    if (kind === "event") {
      ({ error } = await supabase.from("calendar_events").insert({
        user_id: user!.id,
        title: title.trim(),
        event_date: date,
        event_time: time || null,
      }));
    } else {
      const remindAt = new Date(`${date}T${time || "09:00"}:00`).toISOString();
      ({ error } = await supabase.from("reminders").insert({
        user_id: user!.id,
        title: title.trim(),
        remind_at: remindAt,
      }));
    }
    setSaving(false);
    if (error) return setError("No pudimos guardar. Intentá de nuevo.");
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Nuevo evento">
      <div className="space-y-3">
        <div className="flex rounded-lg border border-border p-0.5">
          {(["event", "reminder"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-[13px] transition-colors",
                kind === k ? "bg-accent text-accent-fg" : "text-fg-muted"
              )}
            >
              {k === "event" ? "Evento" : "Recordatorio"}
            </button>
          ))}
        </div>

        <Field label="Título">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={kind === "event" ? "Reunión con contador" : "Pagar monotributo"}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Hora (opcional)">
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>
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
