"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { FileText, Download, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Attachment {
  id: string;
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
}

export function Attachments({
  scope,
  id,
}: {
  scope: "project" | "task";
  id: string;
}) {
  const [items, setItems] = useState<Attachment[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const column = scope === "project" ? "project_id" : "task_id";

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("attachments")
      .select("id, storage_path, file_name, mime_type")
      .eq(column, id)
      .order("created_at", { ascending: false });
    setItems((data as Attachment[]) ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.type !== "application/pdf") {
      setError("Solo se permiten archivos PDF por ahora.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("El archivo supera los 10 MB.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // la política RLS exige que la primera carpeta sea el user_id
    const path = `${user!.id}/${scope}/${id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage
      .from("attachments")
      .upload(path, file, { upsert: false });

    if (upErr) {
      setUploading(false);
      setError("No pudimos subir el archivo. Intentá de nuevo.");
      return;
    }

    const { error: dbErr } = await supabase.from("attachments").insert({
      user_id: user!.id,
      storage_path: path,
      file_name: file.name,
      mime_type: file.type,
      [column]: id,
    });

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (dbErr) {
      setError("El archivo se subió pero no pudimos registrarlo.");
      return;
    }
    load();
  }

  async function download(a: Attachment) {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("attachments")
      .createSignedUrl(a.storage_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  async function remove(a: Attachment) {
    const supabase = createClient();
    await supabase.storage.from("attachments").remove([a.storage_path]);
    await supabase.from("attachments").delete().eq("id", a.id);
    load();
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">Archivos</p>
        <>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={onFile}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Upload size={14} /> {uploading ? "Subiendo…" : "Subir PDF"}
          </Button>
        </>
      </div>

      {error && <p className="mb-2 text-[13px] text-danger">{error}</p>}

      {items === null ? (
        <div className="h-10 animate-pulse rounded-lg bg-surface-2" />
      ) : items.length === 0 ? (
        <p className="text-[13px] text-fg-subtle">Sin archivos adjuntos.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((a) => (
            <li
              key={a.id}
              className="group flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2"
            >
              <FileText size={16} className="shrink-0 text-danger" />
              <span className="min-w-0 flex-1 truncate text-[13px]">
                {a.file_name ?? "archivo.pdf"}
              </span>
              <button
                onClick={() => download(a)}
                className="grid h-7 w-7 place-items-center rounded text-fg-subtle hover:bg-surface-2 hover:text-fg"
                aria-label="Descargar"
              >
                <Download size={14} />
              </button>
              <button
                onClick={() => remove(a)}
                className="grid h-7 w-7 place-items-center rounded text-fg-subtle opacity-0 hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                aria-label="Eliminar"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
