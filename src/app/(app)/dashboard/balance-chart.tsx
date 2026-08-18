"use client";

import { createClient } from "@/lib/supabase/client";
import { formatARS } from "@/lib/utils/format";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Punto {
  mes: string;
  saldo: number;
}

export function BalanceChart() {
  const [data, setData] = useState<Punto[] | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const desde = new Date();
      desde.setMonth(desde.getMonth() - 5);
      desde.setDate(1);
      const { data: txs } = await supabase
        .from("transactions")
        .select("tx_type, amount, tx_date")
        .is("deleted_at", null)
        .eq("is_projected", false)
        .in("tx_type", ["income", "expense"])
        .gte("tx_date", desde.toISOString().slice(0, 10))
        .order("tx_date");

      // acumular saldo por mes
      const meses: Record<string, number> = {};
      let acumulado = 0;
      const etiquetas: string[] = [];
      for (let i = 0; i < 6; i++) {
        const d = new Date(desde);
        d.setMonth(desde.getMonth() + i);
        const key = d.toISOString().slice(0, 7);
        meses[key] = 0;
        etiquetas.push(key);
      }
      for (const t of txs ?? []) {
        const key = t.tx_date.slice(0, 7);
        if (key in meses) {
          meses[key] +=
            t.tx_type === "income" ? Number(t.amount) : -Number(t.amount);
        }
      }
      const puntos: Punto[] = etiquetas.map((key) => {
        acumulado += meses[key];
        const [y, m] = key.split("-");
        const nombre = new Intl.DateTimeFormat("es-AR", { month: "short" }).format(
          new Date(Number(y), Number(m) - 1, 1)
        );
        return { mes: nombre, saldo: acumulado };
      });
      setData(puntos);
    })();
  }, []);

  return (
    <div className="rounded-xl border border-border bg-surface p-[var(--card-p)]">
      <p className="mb-3 text-[13px] text-fg-muted">Evolución económica</p>
      <div className="h-[180px] w-full">
        {data === null ? (
          <div className="h-full w-full animate-pulse rounded bg-surface-2" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
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
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 13,
                }}
                labelStyle={{ color: "hsl(var(--fg-muted))" }}
                formatter={(v: number) => [formatARS(v), "Saldo"]}
              />
              <Area
                type="monotone"
                dataKey="saldo"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                fill="url(#g)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
