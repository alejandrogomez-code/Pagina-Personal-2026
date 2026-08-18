# Centro Personal

Sistema personal de gestión: objetivos del año, economía, ahorro/inversiones,
proyectos laborales y calendario, en un único centro de control.

Stack: Next.js 14 (App Router) · TypeScript · Supabase (Postgres + Auth + RLS +
Storage) · Tailwind CSS · Recharts · Lucide. Deploy en Vercel.

## Estado

- **Fase 1 (lista):** arquitectura, base de datos, auth, layout con sidebar,
  sistema de temas (claro/oscuro/automático, acento, densidad, tamaño de letra),
  dashboard conectado a Supabase.
- **Economía (lista):** movimientos (ingresos/egresos con alta rápida), resumen
  del período con arrastre automático del saldo, presupuesto vs real por
  categoría, y tarjetas con compras en cuotas + total mensual manual.
- **Objetivos (listo):** CRUD, tipos cuantitativo/cualitativo, registro de
  avances con historial, submetas, estados, vistas cards/lista y filtros.
- Pendientes: ahorro/inversiones, proyectos, calendario, integración y refinamiento.

## 1. Variables de entorno

Copiá `.env.example` a `.env.local` y completá con los datos de tu proyecto Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

La `SERVICE_ROLE_KEY` solo se usa del lado servidor y nunca se expone al frontend.

## 2. Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecutá en orden:
   - `supabase/migrations/001_schema_inicial.sql`
   - `supabase/migrations/002_seed_y_vistas.sql`
   - `supabase/migrations/003_funciones_economia.sql`
3. En **Authentication → Providers**, dejá habilitado Email. Para un único
   usuario, desactivá "Enable email confirmations" o confirmá el mail manualmente.
4. Creá tu usuario en **Authentication → Users → Add user**.
5. Logueado en la app por primera vez, corré una vez en el SQL Editor
   (con tu sesión) o desde la app: `select public.seed_default_categories();`
   para cargar las categorías iniciales de ingresos, egresos y objetivos.

Todas las tablas tienen Row Level Security: cada usuario solo ve sus propias filas.

## 3. Desarrollo local

```bash
npm install
npm run dev
```

Abre http://localhost:3000 → redirige a `/login`.

### Tipografía

El proyecto usa Inter con fallback al stack del sistema. Para auto-hostearla con
`next/font` (recomendado en producción), instalá la fuente vía `next/font/google`
en `src/app/layout.tsx`. El fallback del sistema funciona sin configuración.

## 4. Deploy en Vercel

1. Subí el repo a GitHub.
2. Importá el proyecto en Vercel.
3. Cargá las tres variables de entorno en **Settings → Environment Variables**.
4. Deploy. Vercel detecta Next.js automáticamente.

## Estructura

```
src/
  app/
    (auth)/login        Login email/password
    (app)/              Layout con sidebar + topbar
      dashboard         Resumen general (datos reales)
      objetivos         Fase 3
      economia          Fase 4–5
      ahorro            Fase 6
      proyectos         Fase 7
      calendario        Fase 8
      configuracion     Apariencia (funcional)
  components/
    ui/                 Button, Card, StatCard
    layout/             Sidebar, Topbar, PageHeader, EmptyState
    theme-provider      Tema + apariencia
  lib/
    supabase/           Clientes browser/server
    utils/              cn, formato ARS, progreso
supabase/migrations/    SQL para el SQL Editor
```

## Modelo de datos (resumen)

- **Movimientos unificados** en `transactions` con `tx_type`
  (`income`/`expense`/`transfer`/`invest_contribution`/`invest_withdrawal`):
  las transferencias mueven dinero entre cuentas propias sin contarse como
  gasto/ingreso, separando flujo de patrimonio.
- **Tarjetas:** `card_purchases` genera `card_installments` (una fila por cuota
  con su mes). El total mensual del resumen se carga manual en `card_statements`
  (fuente de verdad para el saldo); la suma de cuotas es solo referencia.
- **Objetivos:** el valor actual se calcula sumando `goal_progress`, no editando
  un número suelto. Submetas en `goal_milestones`.
- **Patrimonio:** `assets` + `asset_movements` + `portfolio_snapshots` para la
  evolución mensual.
