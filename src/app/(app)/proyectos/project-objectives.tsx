"use client";

import { EditableNote } from "@/components/ui/editable-note";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { Check, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Objective {
  id: string;
  label: string;
  is_done: boolean;
  sort_order: number;
}

export function ProjectObjectives({
  projectId,
  objectivesText,
}: {
  projectId: string;
  objectivesText: string | null;
}) {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [newLabel, setNewLabel] = useState("");

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("project_objectives")
      .select("id, label, is_done, sort_order")
      .eq("project_id", projectId)
      .order("sort_order");
    setObjectives((data as Objective[]) ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function add() {
    if (!newLabel.trim()) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("project_objectives").insert({
      user_id: user!.id,
      project_id: projectId,
      label: newLabel.trim(),
      sort_order: objectives.length,
    });
    setNewLabel("");
    load();
  }

  async function toggle(o: Objective) {
    const supabase = createClient();
    await supabase
      .from("project_objectives")
      .update({ is_done: !o.is_done })
      .eq("id", o.id);
    load();
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("project_objectives").delete().eq("id", id);
    load();
  }

  const done = objectives.filter((o) => o.is_done).length;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-[var(--card-p)]">
      <EditableNote
        table="projects"
        id={projectId}
        column="objectives_text"
        initial={objectivesText}
        label="Objetivos del proyecto"
        placeholder="Describí qué buscás lograr con este proyecto…"
      />

      <div className="border-t border-border pt-4">
        <p className="mb-2 text-sm font-medium">
          Metas
          {objectives.length > 0 && (
            <span className="ml-2 text-fg-subtle">
              {done}/{objectives.length}
            </span>
          )}
        </p>
        {objectives.length > 0 && (
          <ul className="mb-2 space-y-1">
            {objectives.map((o) => (
              <li key={o.id} className="group flex items-center gap-2.5">
                <button
                  onClick={() => toggle(o)}
                  className={cn(
                    "grid h-4 w-4 shrink-0 place-items-center rounded border",
                    o.is_done
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border-strong"
                  )}
                  aria-label={o.is_done ? "Desmarcar" : "Marcar"}
                >
                  {o.is_done && <Check size={11} />}
                </button>
                <span
                  className={cn(
                    "flex-1 text-[13px]",
                    o.is_done && "text-fg-subtle line-through"
                  )}
                >
                  {o.label}
                </span>
                <button
                  onClick={() => remove(o.id)}
                  className="text-fg-subtle opacity-0 hover:text-danger group-hover:opacity-100"
                  aria-label="Eliminar meta"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Nueva meta"
            className="h-8"
          />
          <Button variant="secondary" size="sm" onClick={add}>
            <Plus size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
