"use client";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { formatARS } from "@/lib/utils/format";
import { useCallback, useEffect, useState } from "react";
import { AhorroTab } from "./ahorro-tab";
import { PatrimonioTab } from "./patrimonio-tab";
import { EvolucionTab } from "./evolucion-tab";

type Tab = "ahorro" | "patrimonio" | "evolucion";

export default function AhorroPage() {
  const [tab, setTab] = useState<Tab>("ahorro");
  const [netWorth, setNetWorth] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("net_worth");
      setNetWorth(Number(data ?? 0));
    })();
  }, [refreshKey]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "ahorro", label: "Objetivos de ahorro" },
    { id: "patrimonio", label: "Patrimonio" },
    { id: "evolucion", label: "Evolución" },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Ahorro / Inversiones"
        subtitle="Objetivos de ahorro y patrimonio"
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Patrimonio actual"
          value={netWorth == null ? "…" : formatARS(netWorth)}
        />
      </div>

      <div className="mb-4 flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-[13px] transition-colors",
              tab === t.id
                ? "border-accent font-medium text-fg"
                : "border-transparent text-fg-muted hover:text-fg"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ahorro" && <AhorroTab onMutate={refresh} />}
      {tab === "patrimonio" && <PatrimonioTab onMutate={refresh} />}
      {tab === "evolucion" && <EvolucionTab />}
    </div>
  );
}
