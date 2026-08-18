"use client";

import { EmptyState } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { formatARS } from "@/lib/utils/format";
import type { CreditCard } from "@/types/domain";
import { CreditCard as CardIcon, Plus, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { CardDetail } from "./card-detail";

interface CardRow extends CreditCard {
  manual_total: number;
  statement_id: string | null;
  cuotas_total: number;
}

export function TarjetasTab({
  period,
  onMutate,
}: {
  period: string;
  onMutate: () => void;
}) {
  const [rows, setRows] = useState<CardRow[] | null>(null);
  const [newCard, setNewCard] = useState(false);
  const [openCard, setOpenCard] = useState<CreditCard | null>(null);

  async function load() {
    const supabase = createClient();
    const { data: cards } = await supabase
      .from("credit_cards")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    const list = (cards as CreditCard[]) ?? [];
    const enriched: CardRow[] = await Promise.all(
      list.map(async (c) => {
        const [{ data: stmt }, { data: total }] = await Promise.all([
          supabase
            .from("card_statements")
            .select("id, manual_total")
            .eq("card_id", c.id)
            .eq("period_month", period)
            .maybeSingle(),
          supabase.rpc("card_installments_total", {
            p_card_id: c.id,
            period,
          }),
        ]);
        return {
          ...c,
          manual_total: stmt?.manual_total ?? 0,
          statement_id: stmt?.id ?? null,
          cuotas_total: Number(total ?? 0),
        };
      })
    );
    setRows(enriched);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  async function saveManual(card: CardRow, value: number) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("card_statements").upsert(
      {
        user_id: user!.id,
        card_id: card.id,
        period_month: period,
        manual_total: value,
      },
      { onConflict: "user_id,card_id,period_month" }
    );
    load();
    onMutate();
  }

  if (openCard) {
    return (
      <CardDetail
        card={openCard}
        period={period}
        onBack={() => {
          setOpenCard(null);
          load();
        }}
        onMutate={onMutate}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] text-fg-muted">
          Total a pagar este mes por tarjeta
        </p>
        <Button variant="secondary" size="sm" onClick={() => setNewCard(true)}>
          <Plus size={15} /> Agregar tarjeta
        </Button>
      </div>

      {rows === null ? (
        <div className="h-32 animate-pulse rounded-xl border border-border bg-surface-2" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Todavía no cargaste tarjetas"
          description="Agregá Visa Macro, Naranja u otra para llevar las cuotas."
          action={
            <Button variant="primary" size="sm" onClick={() => setNewCard(true)}>
              <Plus size={15} /> Agregar tarjeta
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {rows.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-2 text-fg-muted">
                  <CardIcon size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{c.name}</p>
                  {c.issuer && (
                    <p className="text-xs text-fg-subtle">{c.issuer}</p>
                  )}
                </div>
                <button
                  onClick={() => setOpenCard(c)}
                  className="flex items-center gap-1 text-[13px] text-accent hover:underline"
                >
                  Ver cuotas <ChevronRight size={14} />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-border pt-3">
                <ManualTotalInput
                  key={`${c.id}-${period}`}
                  initial={c.manual_total}
                  onSave={(v) => saveManual(c, v)}
                />
                <div className="text-right">
                  <p className="text-xs text-fg-subtle">Cuotas cargadas</p>
                  <p
                    className={cn(
                      "text-sm tabular-nums",
                      c.cuotas_total > 0 && c.manual_total > 0 &&
                        Math.abs(c.cuotas_total - c.manual_total) > 1
                        ? "text-warning"
                        : "text-fg-muted"
                    )}
                  >
                    {formatARS(c.cuotas_total)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {newCard && (
        <NewCardModal
          onClose={() => setNewCard(false)}
          onSaved={() => {
            setNewCard(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function ManualTotalInput({
  initial,
  onSave,
}: {
  initial: number;
  onSave: (v: number) => void;
}) {
  const [value, setValue] = useState(String(initial || ""));

  return (
    <div>
      <p className="mb-1 text-xs text-fg-subtle">Total del resumen (manda)</p>
      <div className="flex items-center gap-2">
        <Input
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            const v = Number(value.replace(",", "."));
            if (!Number.isNaN(v)) onSave(v);
          }}
          placeholder="0"
          className="h-9 w-40"
        />
      </div>
    </div>
  );
}

function NewCardModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [closingDay, setClosingDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    if (!name.trim()) return setError("Ingresá un nombre para la tarjeta.");
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("credit_cards").insert({
      user_id: user!.id,
      name: name.trim(),
      issuer: issuer || null,
      closing_day: closingDay ? Number(closingDay) : null,
      due_day: dueDay ? Number(dueDay) : null,
    });
    setSaving(false);
    if (error) return setError("No pudimos guardar la tarjeta.");
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Agregar tarjeta">
      <div className="space-y-3">
        <Field label="Nombre">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Visa Macro"
          />
        </Field>
        <Field label="Banco / emisor">
          <Input
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            placeholder="Banco Macro"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Día de cierre">
            <Input
              inputMode="numeric"
              value={closingDay}
              onChange={(e) => setClosingDay(e.target.value)}
              placeholder="20"
            />
          </Field>
          <Field label="Día de vencimiento">
            <Input
              inputMode="numeric"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              placeholder="10"
            />
          </Field>
        </div>
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
