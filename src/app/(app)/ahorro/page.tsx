import { PageHeader, EmptyState } from "@/components/layout/page-header";

export default function Page() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Ahorro / Inversiones" subtitle="Objetivos de ahorro y patrimonio" />
      <EmptyState
        title="En construcción"
        description="Esta sección se implementa en la Fase 6. La base ya está lista."
      />
    </div>
  );
}
