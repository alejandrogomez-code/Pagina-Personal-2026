"use client";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { createClient } from "@/lib/supabase/client";
import { todayIso } from "@/lib/utils/period";
import type { Account, Category } from "@/types/domain";
import { useEffect, useState } from "react";

export function TxModal({
  kind,
  period,
  categories,
  onClose,
  onSaved,
}: {
  kind: "income" | "expense";
  period: string;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  // default de fecha: hoy si estamos en el mes actual, si no el día 1 del período
  const defaultDate =
    todayIso().slice(0, 7) === period.slice(0, 7) ? todayIso() : period;

  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ?? "");
  const [date, setDate] = useState(defaultDate);
  const [showMore, setShowMore] = useState(false);
  const [accountId, setAccountId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [note, setNote] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("accounts")
        .select("id, name, kind, currency, is_active")
        .eq("is_active", true);
      setAccounts((data as Account[]) ?? []);
    })();
  }, []);

  async function save() {
    setError(null);
    const value = Number(amount.replace(",", "."));
    if (!concept.trim()) return setError("Ingresá un concepto.");
    if (!value || value <= 0) return setError("El importe debe ser mayor a cero.");

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("transactions").insert({
      user_id: user!.id,
      tx_type: kind,
      tx_date: date,
      concept: concept.trim(),
      amount: value,
      category_id: categoryId || null,
      account_id: accountId || null,
      payment_method: paymentMethod || null,
      note: note || null,
    });
    setSaving(false);
    if (error) return setError("No pudimos guardar el movimiento. Intentá de nuevo.");
    onSaved();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={kind === "income" ? "Nuevo ingreso" : "Nuevo gasto"}
    >
      <div className="space-y-3">
        <Field label="Concepto">
          <Input
            autoFocus
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder={kind === "income" ? "Remuneración" : "Supermercado"}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Importe">
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Fecha">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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

        {!showMore ? (
          <button
            onClick={() => setShowMore(true)}
            className="text-[13px] text-accent hover:underline"
          >
            Más opciones
          </button>
        ) : (
          <div className="space-y-3 border-t border-border pt-3">
            <Field label="Cuenta">
              <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                <option value="">Sin cuenta</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Medio de pago">
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="">—</option>
                <option value="efectivo">Efectivo</option>
                <option value="debito">Débito</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
              </Select>
            </Field>
            <Field label="Nota">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
          </div>
        )}

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
