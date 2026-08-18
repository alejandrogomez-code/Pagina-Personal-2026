"use client";

import { EmptyState } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { formatARS } from "@/lib/utils/format";
import type { BudgetRow, Category } from "@/types/domain";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

export function PresupuestoTab({
  period,
  onMutate,
}: {
  period: string;
  onMutate: () => void;
}) {
  const [rows, setRows] = useState<BudgetRow[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [modal, setModal] = useState(false);

  async function load() {
    const supabase = createClient();
    const [{ data: r }, { data: c }] = await Promise.all([
      supabase.rpc("budget_vs_actual", { period }),
      supabase.from("categories").select("id, name, kind, parent_id").eq("kind", "expense"),
    ]);
    setRows((r as BudgetRow[]) ?? []);
    setCats((c as Category[]) ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const totalPres = (rows ?? []).reduce((a, r) => a + Number(r.presupuestado), 0);
  const totalReal = (rows ?? []).reduce((a, r) => a + Number(r.real_gastado), 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] text-fg-muted">
          Presupuestado vs real del mes
        </p>
        <Button variant="secondary" size="sm" onClick={() => setModal(true)}>
          <Plus size={15} /> Definir presupuesto
        </Button>
      </div>

      {rows === null ? (
        <div className="h-40 animate-pulse rounded-xl border border-border bg-surface-2" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Sin presupuesto este mes"
          description="Definí cuánto planeás gastar por categoría."
          action={
            <Button variant="primary" size="sm" onClick={() => setModal(true)}>
              <Plus size={15} /> Definir presupuesto
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[13px] text-fg-muted">
                <th className="px-4 py-2.5 font-normal">Categoría</th>
                <th className="px-4 py-2.5 text-right font-normal">Presup.</th>
                <th className="px-4 py-2.5 text-right font-normal">Real</th>
                <th className="px-4 py-2.5 text-right font-normal">Disponible</th>
                <th className="hidden px-4 py-2.5 font-normal sm:table-cell">Uso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => {
                const pct =
                  Number(r.presupuestado) > 0
                    ? Math.round(
                        (Number(r.real_gastado) / Number(r.presupuestado)) * 100
                      )
                    : 0;
                const excedido = Number(r.diferencia) < 0;
                return (
                  <tr key={r.category_id}>
                    <td className="px-4 py-2.5">{r.category_name}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatARS(Number(r.presupuestado))}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatARS(Number(r.real_gastado))}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-2.5 text-right tabular-nums",
                        excedido ? "text-danger" : "text-success"
                      )}
                    >
                      {formatARS(Number(r.diferencia))}
                    </td>
                    <td className="hidden px-4 py-2.5 sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-surface-2">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              excedido ? "bg-danger" : "bg-accent"
                            )}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            "w-10 text-right text-xs tabular-nums",
                            excedido ? "text-danger" : "text-fg-subtle"
                          )}
                        >
                          {pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-surface-2 font-medium">
                <td className="px-4 py-2.5">Total</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {formatARS(totalPres)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {formatARS(totalReal)}
                </td>
                <td
                  className={cn(
                    "px-4 py-2.5 text-right tabular-nums",
                    totalPres - totalReal < 0 ? "text-danger" : "text-success"
                  )}
                >
                  {formatARS(totalPres - totalReal)}
                </td>
                <td className="hidden sm:table-cell" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {modal && (
        <BudgetModal
          period={period}
          categories={cats}
          onClose={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            load();
            onMutate();
          }}
        />
      )}
    </div>
  );
}

function BudgetModal({
  period,
  categories,
  onClose,
  onSaved,
}: {
  period: string;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    const value = Number(amount.replace(",", "."));
    if (!categoryId) return setError("Elegí una categoría.");
    if (value < 0 || Number.isNaN(value)) return setError("Importe inválido.");
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("budgets").upsert(
      {
        user_id: user!.id,
        category_id: categoryId,
        period_month: period,
        amount: value,
      },
      { onConflict: "user_id,category_id,period_month" }
    );
    setSaving(false);
    if (error) return setError("No pudimos guardar el presupuesto.");
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Definir presupuesto">
      <div className="space-y-3">
        <Field label="Categoría">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Monto presupuestado">
          <Input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </Field>
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
