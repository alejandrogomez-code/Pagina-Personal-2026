// Utilidades de período mensual (todo se ancla al primer día del mes, ISO).

export function monthStart(d: Date = new Date()): string {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export function addMonths(periodIso: string, delta: number): string {
  const [y, m] = periodIso.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return d.toISOString().slice(0, 10);
}

export function monthLabel(periodIso: string): string {
  const [y, m] = periodIso.split("-").map(Number);
  const label = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function monthShort(periodIso: string): string {
  const [y, m] = periodIso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { month: "short" }).format(
    new Date(y, m - 1, 1)
  );
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
