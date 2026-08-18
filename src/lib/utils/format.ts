// Formateo de moneda y números para ARS.
export function formatARS(value: number, opts?: { compact?: boolean }): string {
  if (opts?.compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-AR").format(value);
}

export function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
  }).format(date);
}

// % de progreso topeado a 100 para visualización (la regla del prompt).
export function clampedProgress(current: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}
