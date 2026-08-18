export type TxType =
  | "income"
  | "expense"
  | "transfer"
  | "invest_contribution"
  | "invest_withdrawal";

export interface Category {
  id: string;
  name: string;
  kind: "income" | "expense";
  parent_id: string | null;
}

export interface Account {
  id: string;
  name: string;
  kind: string;
  currency: string;
  is_active: boolean;
}

export interface Transaction {
  id: string;
  tx_type: TxType;
  tx_date: string;
  concept: string;
  amount: number;
  category_id: string | null;
  account_id: string | null;
  account_to_id: string | null;
  payment_method: string | null;
  is_projected: boolean;
  note: string | null;
}

export interface CreditCard {
  id: string;
  name: string;
  issuer: string | null;
  last4: string | null;
  closing_day: number | null;
  due_day: number | null;
  credit_limit: number | null;
  sort_order: number;
  is_active: boolean;
}

export interface CardPurchase {
  id: string;
  card_id: string;
  purchase_date: string;
  merchant: string;
  total_amount: number;
  installments: number;
  first_period: string;
  category_id: string | null;
  note: string | null;
}

export interface CardInstallment {
  id: string;
  purchase_id: string;
  card_id: string;
  installment_no: number;
  period_month: string;
  amount: number;
}

export interface PeriodSummary {
  saldo_inicial: number;
  ingresos: number;
  egresos: number;
  saldo_periodo: number;
  saldo_final: number;
}

export interface BudgetRow {
  category_id: string;
  category_name: string;
  presupuestado: number;
  real_gastado: number;
  diferencia: number;
}
