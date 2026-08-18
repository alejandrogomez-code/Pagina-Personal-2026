export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-medium">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px] text-fg-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border py-16 text-center">
      <div className="max-w-xs">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="mt-1 text-[13px] text-fg-muted">{description}</p>
        )}
        {action && <div className="mt-4 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
