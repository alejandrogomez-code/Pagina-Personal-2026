"use client";

import { Textarea } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";
import { useState } from "react";

export function EditableNote({
  table,
  id,
  column,
  initial,
  label,
  placeholder,
}: {
  table: string;
  id: string;
  column: string;
  initial: string | null;
  label: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState(initial ?? "");
  const [saved, setSaved] = useState(false);

  async function save() {
    const supabase = createClient();
    await supabase.from(table).update({ [column]: value || null }).eq("id", id);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-success">
            <Check size={12} /> Guardado
          </span>
        )}
      </div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        placeholder={placeholder}
        className="min-h-[96px]"
      />
    </div>
  );
}
