import { PageHeader, EmptyState } from "@/components/layout/page-header";

export default function Page() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Objetivos del Año" subtitle="Lo que querés alcanzar este año" />
      <EmptyState
        title="En construcción"
        description="Esta sección se implementa en la Fase 3. La base ya está lista."
      />
    </div>
  );
}
