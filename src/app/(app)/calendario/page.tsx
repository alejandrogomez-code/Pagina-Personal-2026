import { PageHeader, EmptyState } from "@/components/layout/page-header";

export default function Page() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Calendario" subtitle="Tareas, vencimientos, cuotas y objetivos" />
      <EmptyState
        title="En construcción"
        description="Esta sección se implementa en la Fase 8. La base ya está lista."
      />
    </div>
  );
}
