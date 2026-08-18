"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PeriodNav } from "@/components/ui/period-nav";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { formatARS } from "@/lib/utils/format";
import { monthStart } from "@/lib/utils/period";
import type { PeriodSummary } from "@/types/domain";
import { useCallback, useEffect, useState } from "react";
import { MovimientosTab } from "./movimientos-tab";
import { PresupuestoTab } from "./presupuesto-tab";
import { TarjetasTab } from "./tarjetas-tab";

type Tab = "movimientos" | "presupuesto" | "tarjetas";

export default function EconomiaPage() {
  const [period, setPeriod] = useState(monthStart());
  const [tab, setTab] = useState<Tab>("movimientos");
  const [summary, setSummary] = useState<PeriodSummary | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("period_summary", { period });
      if (data && data[0]) setSummary(data[0]);
    })();
  }, [period, refreshKey]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Economía"
        subtitle="Ingresos, egresos, presupuesto y tarjetas"
        action={<PeriodNav period={period} onChange={setPeriod} />}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <ResumenItem label="Saldo inicial" value={summary?.saldo_inicial} />
        <ResumenItem label="Ingresos" value={summary?.ingresos} tone="pos" />
        <ResumenItem label="Egresos" value={summary?.egresos} tone="neg" />
        <ResumenItem
          label="Saldo del período"
          value={summary?.saldo_periodo}
          tone="signed"
        />
        <ResumenItem label="Saldo final" value={summary?.saldo_final} strong />
      </div>

      <div className="mb-4 flex gap-1 border-b border-border">
        {(["movimientos", "presupuesto", "tarjetas"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-[13px] capitalize transition-colors",
              tab === t
                ? "border-accent font-medium text-fg"
                : "border-transparent text-fg-muted hover:text-fg"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "movimientos" && (
        <MovimientosTab period={period} onMutate={refresh} />
      )}
      {tab === "presupuesto" && (
        <PresupuestoTab period={period} onMutate={refresh} />
      )}
      {tab === "tarjetas" && <TarjetasTab period={period} onMutate={refresh} />}
    </div>
  );
}

function ResumenItem({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value?: number;
  tone?: "pos" | "neg" | "signed";
  strong?: boolean;
}) {
  const color =
    tone === "pos"
      ? "text-success"
      : tone === "neg"
      ? "text-danger"
      : tone === "signed" && value != null
      ? value < 0
        ? "text-danger"
        : "text-success"
      : "text-fg";

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-[var(--card-p)]",
        strong && "bg-surface-2"
      )}
    >
      <p className="text-[13px] text-fg-muted">{label}</p>
      <p className={cn("mt-1 text-lg font-medium tracking-tight", color)}>
        {value == null ? (
          <span className="inline-block h-5 w-20 animate-pulse rounded bg-surface-2" />
        ) : (
          formatARS(value)
        )}
      </p>
    </div>
  );
}
