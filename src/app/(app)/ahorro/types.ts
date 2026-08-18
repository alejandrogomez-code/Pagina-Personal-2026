export type AssetType =
  | "cash"
  | "bank"
  | "term_deposit"
  | "fci"
  | "stocks"
  | "bonds"
  | "crypto"
  | "other";

export interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  notes: string | null;
}

export interface Asset {
  id: string;
  name: string;
  asset_type: AssetType;
  institution: string | null;
  currency: string;
  current_value: number;
  valued_at: string;
  quantity: number | null;
  buy_price: number | null;
  current_price: number | null;
  notes: string | null;
}

export interface DistRow {
  asset_type: AssetType;
  total: number;
  pct: number;
}

export interface Snapshot {
  snapshot_month: string;
  total_value: number;
}

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  cash: "Efectivo",
  bank: "Cuenta bancaria",
  term_deposit: "Plazo fijo",
  fci: "FCI",
  stocks: "Acciones",
  bonds: "Bonos",
  crypto: "Cripto",
  other: "Otros",
};
