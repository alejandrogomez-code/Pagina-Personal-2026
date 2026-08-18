"use client";

import { EmptyState } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { createClient } from "@/lib/supabase/client";
import { formatARS } from "@/lib/utils/format";
import { todayIso, monthStart } from "@/lib/utils/period";
import { ASSET_TYPE_LABELS, type Asset, type AssetType, type DistRow } from "./types";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const DONUT_COLORS = [
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(217 40% 70%)",
  "hsl(175 45% 55%)",
  "hsl(250 50% 68%)",
  "hsl(12 60% 62%)",
  "hsl(220 10% 55%)",
];

export function PatrimonioTab({ onMutate }: { onMutate: () => void }) {
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [dist, setDist] = useState<DistRow[]>([]);
  const [modal, setModal] = useState(false);
  const [moveAsset, setMoveAsset] = useState<Asset | null>(null);

  async function load() {
    const supabase = createClient();
    const [{ data: a }, { data: d }] = await Promise.all([
      supabase.from("assets").select("*").is("deleted_at", null).order("current_value", { ascending: false }),
      supabase.rpc("net_worth_distribution"),
    ]);
    setAssets((a as Asset[]) ?? []);
    setDist((d as DistRow[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("assets").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    load();
    onMutate();
  }

  async function snapshot() {
    const supabase = createClient();
    await supabase.rpc("snapshot_net_worth", { period: monthStart() });
    onMutate();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={snapshot}>
          Guardar snapshot del mes
        </Button>
        <Button variant="primary" size="sm" onClick={() => setModal(true)}>
          <Plus size={15} /> Nuevo activo
        </Button>
      </div>

      {assets === null ? (
        <div className="h-40 animate-pulse rounded-xl border border-border bg-surface-2" />
      ) : assets.length === 0 ? (
        <EmptyState
          title="Sin activos registrados"
          description="Registrá dónde está tu dinero: cuentas, plazo fijo, FCI, acciones."
          action={
            <Button variant="primary" size="sm" onClick={() => setModal(true)}>
              <Plus size={15} /> Nuevo activo
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <ul className="space-y-2">
            {assets.map((a) => (
              <li key={a.id} className="group rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-fg-subtle">
                      {ASSET_TYPE_LABELS[a.asset_type]}
                      {a.institution && ` · ${a.institution}`}
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {formatARS(Number(a.current_value))}
                  </span>
                  <button
                    onClick={() => remove(a.id)}
                    className="text-fg-subtle opacity-0 hover:text-danger group-hover:opacity-100"
                    aria-label="Eliminar activo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => setMoveAsset(a)}
                    className="text-[13px] text-accent hover:underline"
                  >
                    Registrar movimiento
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-border bg-surface p-[var(--card-p)]">
            <p className="mb-3 text-sm font-medium">Distribución</p>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dist}
                    dataKey="total"
                    nameKey="asset_type"
                    innerRadius={44}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {dist.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--surface))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                    formatter={(v: number, _n, p) => [
                      formatARS(v),
                      ASSET_TYPE_LABELS[(p.payload.asset_type as AssetType)] ?? "",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 space-y-1.5">
              {dist.map((d, i) => (
                <li key={d.asset_type} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                  />
                  <span className="flex-1 text-fg-muted">
                    {ASSET_TYPE_LABELS[d.asset_type]}
                  </span>
                  <span className="tabular-nums text-fg-subtle">{d.pct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {modal && (
        <AssetModal
          onClose={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            load();
            onMutate();
          }}
        />
      )}
      {moveAsset && (
        <MovementModal
          asset={moveAsset}
          onClose={() => setMoveAsset(null)}
          onSaved={() => {
            setMoveAsset(null);
            load();
            onMutate();
          }}
        />
      )}
    </div>
  );
}

function AssetModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AssetType>("bank");
  const [institution, setInstitution] = useState("");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    if (!name.trim()) return setError("Ingresá un nombre.");
    const v = Number(value.replace(",", "."));
    if (Number.isNaN(v) || v < 0) return setError("Valor inválido.");
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("assets").insert({
      user_id: user!.id,
      name: name.trim(),
      asset_type: type,
      institution: institution || null,
      current_value: v,
      valued_at: todayIso(),
      notes: notes || null,
    });
    setSaving(false);
    if (error) return setError("No pudimos guardar el activo.");
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Nuevo activo">
      <div className="space-y-3">
        <Field label="Nombre">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Plazo fijo Nación" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo">
            <Select value={type} onChange={(e) => setType(e.target.value as AssetType)}>
              {(Object.keys(ASSET_TYPE_LABELS) as AssetType[]).map((t) => (
                <option key={t} value={t}>
                  {ASSET_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Valor actual">
            <Input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
          </Field>
        </div>
        <Field label="Institución">
          <Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Banco Nación" />
        </Field>
        <Field label="Notas">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Crear"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function MovementModal({
  asset,
  onClose,
  onSaved,
}: {
  asset: Asset;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<"contribution" | "withdrawal" | "valuation">("contribution");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    const v = Number(amount.replace(",", "."));
    if (!v || v < 0) return setError("Ingresá un importe válido.");
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("apply_asset_movement", {
      p_asset_id: asset.id,
      p_type: type,
      p_amount: v,
      p_date: date,
      p_note: note || null,
    });
    setSaving(false);
    if (error) return setError("No pudimos registrar el movimiento.");
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title={`Movimiento · ${asset.name}`}>
      <div className="space-y-3">
        <Field label="Tipo">
          <Select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            <option value="contribution">Aporte (suma)</option>
            <option value="withdrawal">Retiro (resta)</option>
            <option value="valuation">Nueva valuación (fija el valor)</option>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={type === "valuation" ? "Nuevo valor" : "Importe"}>
            <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </Field>
          <Field label="Fecha">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Nota (opcional)">
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Registrar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
