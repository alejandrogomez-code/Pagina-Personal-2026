"use client";

import { cn } from "@/lib/utils/cn";
import { clampedProgress, formatNumber } from "@/lib/utils/format";
import { STATUS_LABELS, type Goal } from "./types";

export function GoalCard({
  goal,
  current,
  category,
  onClick,
}: {
  goal: Goal;
  current: number;
  category?: string;
  onClick: () => void;
}) {
  const isQuant = goal.goal_type === "quantitative";
  const target = Number(goal.target ?? 0);
  const pct = clampedProgress(current, target);
  const excede = isQuant && target > 0 && current > target;

  return (
    <button
      onClick={onClick}
      className="flex flex-col rounded-xl border border-border bg-surface p-[var(--card-p)] text-left transition-colors hover:border-border-strong"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{goal.name}</p>
        <StatusPill status={goal.status} />
      </div>

      {category && <p className="mb-3 text-xs text-fg-subtle">{category}</p>}

      {isQuant ? (
        <div className="mt-auto">
          <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
            <span className="tabular-nums text-fg-muted">
              {formatNumber(current)}
              {goal.unit && goal.unit !== "ARS" ? ` / ${formatNumber(target)}` : ""}
            </span>
            <span className="font-medium text-accent">{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          {excede && (
            <p className="mt-1 text-xs text-success">
              +{formatNumber(current - target)} adicional
            </p>
          )}
        </div>
      ) : (
        <p className="mt-auto text-[13px] text-fg-muted">
          {goal.description || "Objetivo cualitativo"}
        </p>
      )}
    </button>
  );
}

function StatusPill({ status }: { status: Goal["status"] }) {
  const styles: Record<Goal["status"], string> = {
    not_started: "bg-surface-2 text-fg-muted",
    in_progress: "bg-accent-soft text-accent",
    completed: "bg-success/10 text-success",
    paused: "bg-warning/10 text-warning",
    abandoned: "bg-surface-2 text-fg-subtle line-through",
  };
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[11px]",
        styles[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
