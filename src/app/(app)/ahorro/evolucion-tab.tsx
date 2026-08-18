"use client";

import { EmptyState } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/client";
import { formatARS } from "@/lib/utils/format";
import { monthShort } from "@/lib/utils/period";
import type { Snapshot } from "./types";
import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function EvolucionTab() {
  const [data, setData] = useState<{ mes: string; valor: number }[] | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: snaps } = await supabase
        .from("portfolio_snapshots")
        .select("snapshot_month, total_value")
        .order("snapshot_month");
      const points = ((snaps as Snapshot[]) ?? []).map((s) => ({
        mes: monthShort(s.snapshot_month),
        valor: Number(s.total_value),
      }));
      setData(points);
    })();
  }, []);

  if (data === null) {
    return <div className="h-64 animate-pulse rounded-xl border border-border bg-surface-2" />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title="Sin historial de patrimonio"
        description="Guardá un snapshot del mes en la pestaña Patrimonio para empezar la curva."
      />
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-[var(--card-p)]">
      <p className="mb-3 text-sm font-medium">Evolución del patrimonio</p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.18} />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="mes"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--fg-subtle))" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={70}
              tick={{ fontSize: 11, fill: "hsl(var(--fg-subtle))" }}
              tickFormatter={(v) => formatARS(v, { compact: true })}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--surface))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 13,
              }}
              formatter={(v: number) => [formatARS(v), "Patrimonio"]}
            />
            <Area
              type="monotone"
              dataKey="valor"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              fill="url(#gp)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
