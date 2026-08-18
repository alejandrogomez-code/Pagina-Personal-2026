import { StatCard } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { clampedProgress, formatARS } from "@/lib/utils/format";
import { BalanceChart } from "./balance-chart";
import { Target, ListChecks } from "lucide-react";

function saludo() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  // Consultas en paralelo (todas filtradas por RLS al usuario)
  const [
    { data: goals },
    { data: txs },
    { data: assets },
    { data: projects },
    { data: tasks },
  ] = await Promise.all([
    supabase.from("goals").select("id, name, target, status, unit").is("deleted_at", null),
    supabase
      .from("transactions")
      .select("tx_type, amount, tx_date")
      .is("deleted_at", null)
      .gte("tx_date", primerDiaMes)
      .eq("is_projected", false),
    supabase.from("assets").select("current_value").is("deleted_at", null),
    supabase.from("projects").select("id, status").is("deleted_at", null),
    supabase
      .from("tasks")
      .select("id, title, due_date, status")
      .is("deleted_at", null)
      .neq("status", "done"),
  ]);

  // Progreso de objetivos: necesita la suma de goal_progress
  const goalIds = (goals ?? []).map((g) => g.id);
  let progresoPorObjetivo: Record<string, number> = {};
  if (goalIds.length) {
    const { data: prog } = await supabase
      .from("goal_progress")
      .select("goal_id, amount")
      .in("goal_id", goalIds);
    for (const p of prog ?? []) {
      progresoPorObjetivo[p.goal_id] =
        (progresoPorObjetivo[p.goal_id] ?? 0) + Number(p.amount);
    }
  }

  const objetivosActivos = (goals ?? []).filter(
    (g) => g.status === "in_progress" || g.status === "not_started"
  );
  const objetivosCompletados = (goals ?? []).filter((g) => g.status === "completed");
  const promedioAvance =
    (goals ?? []).length === 0
      ? 0
      : Math.round(
          (goals ?? []).reduce((acc, g) => {
            const actual = progresoPorObjetivo[g.id] ?? 0;
            return acc + clampedProgress(actual, Number(g.target ?? 0));
          }, 0) / (goals ?? []).length
        );

  const ingresos = (txs ?? [])
    .filter((t) => t.tx_type === "income")
    .reduce((a, t) => a + Number(t.amount), 0);
  const egresos = (txs ?? [])
    .filter((t) => t.tx_type === "expense")
    .reduce((a, t) => a + Number(t.amount), 0);
  const saldoPeriodo = ingresos - egresos;

  const patrimonio = (assets ?? []).reduce((a, x) => a + Number(x.current_value), 0);
  const proyectosActivos = (projects ?? []).filter(
    (p) => p.status === "in_progress" || p.status === "planning"
  ).length;

  const tareasVencidas = (tasks ?? []).filter(
    (t) => t.due_date && t.due_date < hoy.toISOString().slice(0, 10)
  );
  const proximasTareas = (tasks ?? [])
    .filter((t) => t.due_date)
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1))
    .slice(0, 5);

  const objetivosTop = objetivosActivos.slice(0, 4).map((g) => ({
    name: g.name,
    pct: clampedProgress(progresoPorObjetivo[g.id] ?? 0, Number(g.target ?? 0)),
  }));

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-xl font-medium">
          {saludo()}
          {user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}
        </h1>
        <p className="text-[13px] text-fg-muted">
          {new Intl.DateTimeFormat("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(hoy)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Objetivos"
          value={`${promedioAvance}%`}
          hint={`${objetivosActivos.length} activos · ${objetivosCompletados.length} completados`}
        />
        <StatCard
          label="Saldo del mes"
          value={formatARS(saldoPeriodo, { compact: true })}
          hint={`Ingresos ${formatARS(ingresos, { compact: true })}`}
        />
        <StatCard
          label="Patrimonio"
          value={formatARS(patrimonio, { compact: true })}
        />
        <StatCard
          label="Proyectos"
          value={proyectosActivos}
          hint={`${tareasVencidas.length} tareas vencidas`}
        />
      </div>

      <BalanceChart />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-[var(--card-p)]">
          <div className="mb-3 flex items-center gap-2 text-[13px] text-fg-muted">
            <Target size={15} /> Objetivos
          </div>
          {objetivosTop.length === 0 ? (
            <EmptyMini texto="Todavía no tenés objetivos activos." />
          ) : (
            <ul className="space-y-3">
              {objetivosTop.map((o) => (
                <li key={o.name}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span className="truncate">{o.name}</span>
                    <span className="text-accent">{o.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${o.pct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-[var(--card-p)]">
          <div className="mb-3 flex items-center gap-2 text-[13px] text-fg-muted">
            <ListChecks size={15} /> Próximas tareas
          </div>
          {proximasTareas.length === 0 ? (
            <EmptyMini texto="No tenés tareas pendientes." />
          ) : (
            <ul className="space-y-2">
              {proximasTareas.map((t) => {
                const vencida =
                  t.due_date! < hoy.toISOString().slice(0, 10);
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between text-[13px]"
                  >
                    <span className="truncate">{t.title}</span>
                    <span
                      className={
                        vencida ? "text-danger" : "text-fg-subtle"
                      }
                    >
                      {new Intl.DateTimeFormat("es-AR", {
                        day: "numeric",
                        month: "short",
                      }).format(new Date(t.due_date!))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyMini({ texto }: { texto: string }) {
  return <p className="py-6 text-center text-[13px] text-fg-subtle">{texto}</p>;
}
