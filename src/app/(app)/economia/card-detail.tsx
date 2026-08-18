"use client";

import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { createClient } from "@/lib/supabase/client";
import { formatARS } from "@/lib/utils/format";
import { monthShort, monthStart, todayIso } from "@/lib/utils/period";
import type { Category, CreditCard, CardPurchase } from "@/types/domain";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface PurchaseWithInst extends CardPurchase {
  cuotas: { installment_no: number; period_month: string; amount: number }[];
}

export function CardDetail({
  card,
  period,
  onBack,
  onMutate,
}: {
  card: CreditCard;
  period: string;
  onBack: () => void;
  onMutate: () => void;
}) {
  const [purchases, setPurchases] = useState<PurchaseWithInst[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [modal, setModal] = useState(false);

  async function load() {
    const supabase = createClient();
    const [{ data: purs }, { data: c }] = await Promise.all([
      supabase
        .from("card_purchases")
        .select("*")
        .eq("card_id", card.id)
        .is("deleted_at", null)
        .order("purchase_date", { ascending: false }),
      supabase.from("categories").select("id, name, kind, parent_id").eq("kind", "expense"),
    ]);
    const list = (purs as CardPurchase[]) ?? [];
    const withInst: PurchaseWithInst[] = await Promise.all(
      list.map(async (p) => {
        const { data: inst } = await supabase
          .from("card_installments")
          .select("installment_no, period_month, amount")
          .eq("purchase_id", p.id)
          .order("installment_no");
        return { ...p, cuotas: inst ?? [] };
      })
    );
    setPurchases(withInst);
    setCats((c as Category[]) ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);

  async function remove(id: string) {
    const supabase = createClient();
    await supabase
      .from("card_purchases")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    load();
    onMutate();
  }

  // total de cuotas que caen en el período visible
  const totalDelMes = (purchases ?? []).reduce((acc, p) => {
    const c = p.cuotas.find((x) => x.period_month === period);
    return acc + (c ? Number(c.amount) : 0);
  }, 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-fg"
        >
          <ArrowLeft size={15} /> Volver
        </button>
        <Button variant="primary" size="sm" onClick={() => setModal(true)}>
          <Plus size={15} /> Nueva compra
        </Button>
      </div>

      <div className="mb-4 rounded-xl border border-border bg-surface-2 p-4">
        <p className="text-sm font-medium">{card.name}</p>
        <p className="mt-0.5 text-[13px] text-fg-muted">
          Cuotas que caen en {monthShort(period)}:{" "}
          <span className="font-medium text-fg">{formatARS(totalDelMes)}</span>
        </p>
      </div>

      {purchases === null ? (
        <div className="h-40 animate-pulse rounded-xl border border-border bg-surface-2" />
      ) : purchases.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-fg-subtle">
          Sin compras cargadas en esta tarjeta.
        </p>
      ) : (
        <ul className="space-y-2">
          {purchases.map((p) => (
            <li
              key={p.id}
              className="group rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.merchant}</p>
                  <p className="text-xs text-fg-subtle">
                    {formatARS(Number(p.total_amount))} en {p.installments}{" "}
                    {p.installments === 1 ? "cuota" : "cuotas"} ·{" "}
                    {new Intl.DateTimeFormat("es-AR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(p.purchase_date))}
                  </p>
                </div>
                <button
                  onClick={() => remove(p.id)}
                  className="grid h-7 w-7 place-items-center rounded text-fg-subtle opacity-0 transition-opacity hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                  aria-label="Eliminar compra"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Despliegue de cuotas por mes */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.cuotas.map((c) => {
                  const activa = c.period_month === period;
                  return (
                    <span
                      key={c.installment_no}
                      className={
                        "rounded border px-2 py-1 text-xs tabular-nums " +
                        (activa
                          ? "border-accent bg-accent-soft text-fg"
                          : "border-border text-fg-muted")
                      }
                      title={`Cuota ${c.installment_no} · ${monthShort(
                        c.period_month
                      )}`}
                    >
                      {c.installment_no}/{p.installments} · {monthShort(c.period_month)}{" "}
                      {formatARS(Number(c.amount))}
                    </span>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      )}

      {modal && (
        <PurchaseModal
          card={card}
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

function PurchaseModal({
  card,
  period,
  categories,
  onClose,
  onSaved,
}: {
  card: CreditCard;
  period: string;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [merchant, setMerchant] = useState("");
  const [total, setTotal] = useState("");
  const [installments, setInstallments] = useState("1");
  const [purchaseDate, setPurchaseDate] = useState(todayIso());
  const [firstPeriod, setFirstPeriod] = useState(period);
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    const value = Number(total.replace(",", "."));
    const n = Number(installments);
    if (!merchant.trim()) return setError("Ingresá el comercio.");
    if (!value || value <= 0) return setError("El importe debe ser mayor a cero.");
    if (!n || n < 1) return setError("Cantidad de cuotas inválida.");

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: purchase, error: insErr } = await supabase
      .from("card_purchases")
      .insert({
        user_id: user!.id,
        card_id: card.id,
        purchase_date: purchaseDate,
        merchant: merchant.trim(),
        total_amount: value,
        installments: n,
        first_period: monthStart(new Date(firstPeriod + "T00:00:00")),
        category_id: categoryId || null,
      })
      .select("id")
      .single();

    if (insErr || !purchase) {
      setSaving(false);
      return setError("No pudimos guardar la compra.");
    }

    // generar las cuotas
    const { error: genErr } = await supabase.rpc("generate_installments", {
      p_purchase_id: purchase.id,
    });
    setSaving(false);
    if (genErr) return setError("La compra se guardó pero falló el cálculo de cuotas.");
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title={`Nueva compra · ${card.name}`}>
      <div className="space-y-3">
        <Field label="Comercio">
          <Input
            autoFocus
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="Mercado Libre"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Importe total">
            <Input
              inputMode="decimal"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Cantidad de cuotas">
            <Input
              inputMode="numeric"
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha de compra">
            <Input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </Field>
          <Field label="Primera cuota (mes)">
            <Input
              type="month"
              value={firstPeriod.slice(0, 7)}
              onChange={(e) => setFirstPeriod(e.target.value + "-01")}
            />
          </Field>
        </div>
        <Field label="Categoría">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Guardar compra"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
