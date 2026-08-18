"use client";

import { addMonths, monthLabel } from "@/lib/utils/period";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PeriodNav({
  period,
  onChange,
}: {
  period: string;
  onChange: (p: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(addMonths(period, -1))}
        className="grid h-8 w-8 place-items-center rounded border border-border text-fg-muted hover:bg-surface-2 hover:text-fg"
        aria-label="Mes anterior"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="min-w-[140px] text-center text-sm font-medium">
        {monthLabel(period)}
      </span>
      <button
        onClick={() => onChange(addMonths(period, 1))}
        className="grid h-8 w-8 place-items-center rounded border border-border text-fg-muted hover:bg-surface-2 hover:text-fg"
        aria-label="Mes siguiente"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
