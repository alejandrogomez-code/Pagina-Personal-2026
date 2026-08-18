"use client";

import { EmptyState } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { formatARS } from "@/lib/utils/format";
import { addMonths } from "@/lib/utils/period";
import type { Category, Transaction } from "@/types/domain";
import { ArrowDownLeft, ArrowUpRight, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { TxModal } from "./tx-modal";

export function MovimientosTab({
  period,
  onMutate,
}: {
  period: string;
  onMutate: () => void;
}) {
  const [txs, setTxs] = useState<Transaction[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [modal, setModal] = useState<null | "income" | "expense">(null);

  async function load() {
    const supabase = createClient();
    const next = addMonths(period, 1);
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .is("deleted_at", null)
        .gte("tx_date", period)
        .lt("tx_date", next)
        .order("tx_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name, kind, parent_id"),
    ]);
    setTxs((t as Transaction[]) ?? []);
    setCats((c as Category[]) ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  async function remove(id: string) {
    const supabase = createClient();
    await supabase
      .from("transactions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    load();
    onMutate();
  }

  const catName = (id: string | null) =>
    cats.find((c) => c.id === id)?.name ?? "Sin categoría";

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <Button variant="primary" size="sm" onClick={() => setModal("income")}>
          <Plus size={15} /> Ingreso
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setModal("expense")}>
          <Plus size={15} /> Gasto
        </Button>
      </div>

      {txs === null ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg border border-border bg-surface-2"
            />
          ))}
        </div>
      ) : txs.length === 0 ? (
        <EmptyState
          title="Sin movimientos este mes"
          description="Registrá tu primer ingreso o gasto del período."
          action={
            <Button variant="primary" size="sm" onClick={() => setModal("expense")}>
              <Plus size={15} /> Nuevo gasto
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {txs.map((t) => {
            const income = t.tx_type === "income";
            return (
              <li
                key={t.id}
                className="group flex items-center gap-3 px-4 py-3 hover:bg-surface-2"
              >
                <div
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                    income
                      ? "bg-success/10 text-success"
                      : "bg-danger/10 text-danger"
                  )}
                >
                  {income ? (
                    <ArrowDownLeft size={16} />
                  ) : (
                    <ArrowUpRight size={16} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{t.concept}</p>
                  <p className="text-xs text-fg-subtle">
                    {catName(t.category_id)} ·{" "}
                    {new Intl.DateTimeFormat("es-AR", {
                      day: "numeric",
                      month: "short",
                    }).format(new Date(t.tx_date))}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    income ? "text-success" : "text-fg"
                  )}
                >
                  {income ? "+" : "−"}
                  {formatARS(Number(t.amount))}
                </span>
                <button
                  onClick={() => remove(t.id)}
                  className="grid h-7 w-7 place-items-center rounded text-fg-subtle opacity-0 transition-opacity hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                  aria-label="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {modal && (
        <TxModal
          kind={modal}
          period={period}
          categories={cats.filter((c) => c.kind === modal)}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
            onMutate();
          }}
        />
      )}
    </div>
  );
}
