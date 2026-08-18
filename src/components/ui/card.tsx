import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface",
        "p-[var(--card-p)]",
        className
      )}
      {...props}
    />
  );
}

export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface p-[var(--card-p)]", className)}>
      <p className="text-[13px] text-fg-muted">{label}</p>
      <p className="mt-1 text-2xl font-medium tracking-tight">{value}</p>
      {hint != null && <p className="mt-0.5 text-xs text-fg-subtle">{hint}</p>}
    </div>
  );
}
