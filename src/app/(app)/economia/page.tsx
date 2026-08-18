import { PageHeader, EmptyState } from "@/components/layout/page-header";

export default function Page() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Economía" subtitle="Ingresos, egresos, presupuesto y tarjetas" />
      <EmptyState
        title="En construcción"
        description="Esta sección se implementa en la Fase 4. La base ya está lista."
      />
    </div>
  );
}
