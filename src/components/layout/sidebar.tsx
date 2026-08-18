"use client";

import { cn } from "@/lib/utils/cn";
import {
  LayoutGrid,
  Target,
  Wallet,
  TrendingUp,
  Briefcase,
  Calendar,
  Settings,
  ChevronLeft,
  PanelLeft,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/objetivos", label: "Objetivos", icon: Target },
  { href: "/economia", label: "Economía", icon: Wallet },
  { href: "/ahorro", label: "Ahorro / Inversiones", icon: TrendingUp },
  { href: "/proyectos", label: "Proyectos", icon: Briefcase },
  { href: "/calendario", label: "Calendario", icon: Calendar },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border bg-surface-2 transition-all duration-200",
        collapsed ? "w-[64px]" : "w-[220px]"
      )}
    >
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="grid h-6 w-6 shrink-0 place-items-center rounded bg-accent">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-accent-fg" />
        </div>
        {!collapsed && <span className="text-sm font-medium">Centro Personal</span>}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto grid h-7 w-7 place-items-center rounded text-fg-subtle hover:bg-surface hover:text-fg"
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
        >
          {collapsed ? <PanelLeft size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-2">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded px-2.5 py-2 text-[13px] transition-colors",
                active
                  ? "bg-surface font-medium text-fg shadow-[inset_0_0_0_1px_hsl(var(--border))]"
                  : "text-fg-muted hover:bg-surface hover:text-fg",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={17} className={active ? "text-accent" : ""} />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-2">
        <Link
          href="/configuracion"
          className={cn(
            "flex items-center gap-3 rounded px-2.5 py-2 text-[13px] text-fg-muted hover:bg-surface hover:text-fg",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? "Configuración" : undefined}
        >
          <Settings size={17} />
          {!collapsed && <span>Configuración</span>}
        </Link>
      </div>
    </aside>
  );
}
