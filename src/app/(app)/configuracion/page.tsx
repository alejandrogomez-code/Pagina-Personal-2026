"use client";

import { PageHeader } from "@/components/layout/page-header";
import { useAppearance } from "@/components/theme-provider";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";

const acentos = [
  { id: "steel", label: "Azul acero", hsl: "217 60% 55%" },
  { id: "violet", label: "Violeta", hsl: "250 62% 60%" },
  { id: "teal", label: "Teal", hsl: "175 58% 40%" },
  { id: "amber", label: "Ámbar", hsl: "32 80% 50%" },
  { id: "coral", label: "Coral", hsl: "12 72% 58%" },
] as const;

export default function ConfigPage() {
  const { theme, setTheme } = useTheme();
  const { accent, density, fontSize, setAccent, setDensity, setFontSize } =
    useAppearance();
  const [saved, setSaved] = useState(false);

  // Persistir cambios en Supabase (debounce simple)
  useEffect(() => {
    const t = setTimeout(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("user_preferences")
        .update({
          theme: theme ?? "system",
          accent,
          density,
          font_size: fontSize,
        })
        .eq("user_id", user.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 500);
    return () => clearTimeout(t);
  }, [theme, accent, density, fontSize]);

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader
        title="Configuración"
        subtitle="Personalizá la apariencia de tu centro de control"
        action={
          saved ? (
            <span className="flex items-center gap-1 text-[13px] text-success">
              <Check size={14} /> Guardado
            </span>
          ) : null
        }
      />

      <div className="space-y-6">
        <Section title="Tema">
          <SegGroup
            value={theme ?? "system"}
            onChange={setTheme}
            options={[
              { id: "light", label: "Claro" },
              { id: "dark", label: "Oscuro" },
              { id: "system", label: "Automático" },
            ]}
          />
        </Section>

        <Section title="Color de acento">
          <div className="flex gap-2.5">
            {acentos.map((a) => (
              <button
                key={a.id}
                onClick={() => setAccent(a.id as typeof accent)}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full transition-transform hover:scale-105",
                  accent === a.id && "ring-2 ring-offset-2 ring-offset-bg"
                )}
                style={{
                  background: `hsl(${a.hsl})`,
                  boxShadow: accent === a.id ? `0 0 0 2px hsl(${a.hsl})` : undefined,
                }}
                title={a.label}
                aria-label={a.label}
              >
                {accent === a.id && <Check size={15} className="text-white" />}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Densidad">
          <SegGroup
            value={density}
            onChange={(v) => setDensity(v as typeof density)}
            options={[
              { id: "compact", label: "Compacta" },
              { id: "normal", label: "Normal" },
              { id: "comfortable", label: "Cómoda" },
            ]}
          />
        </Section>

        <Section title="Tamaño de letra">
          <SegGroup
            value={fontSize}
            onChange={(v) => setFontSize(v as typeof fontSize)}
            options={[
              { id: "small", label: "Pequeño" },
              { id: "normal", label: "Normal" },
              { id: "large", label: "Grande" },
            ]}
          />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-[var(--card-p)]">
      <p className="mb-3 text-sm font-medium">{title}</p>
      {children}
    </div>
  );
}

function SegGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-lg border border-border p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-md px-3 py-1.5 text-[13px] transition-colors",
            value === o.id
              ? "bg-accent text-accent-fg"
              : "text-fg-muted hover:text-fg"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
