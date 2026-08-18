import { PageHeader, EmptyState } from "@/components/layout/page-header";

export default function Page() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Proyectos" subtitle="Contabilidad, Desarrollo de Fondos y más" />
      <EmptyState
        title="En construcción"
        description="Esta sección se implementa en la Fase 7. La base ya está lista."
      />
    </div>
  );
}
