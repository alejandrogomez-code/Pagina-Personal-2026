"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import {
  LayoutGrid,
  Target,
  Wallet,
  TrendingUp,
  Briefcase,
  Calendar,
  Settings,
  Menu,
  X,
  LogOut,
  Search,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/objetivos", label: "Objetivos", icon: Target },
  { href: "/economia", label: "Economía", icon: Wallet },
  { href: "/ahorro", label: "Ahorro / Inversiones", icon: TrendingUp },
  { href: "/proyectos", label: "Proyectos", icon: Briefcase },
  { href: "/calendario", label: "Calendario", icon: Calendar },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export function Topbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border px-4">
      <button
        className="grid h-8 w-8 place-items-center rounded text-fg-muted hover:bg-surface-2 md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu size={18} />
      </button>

      <button className="flex h-8 items-center gap-2 rounded border border-border px-3 text-[13px] text-fg-subtle hover:bg-surface-2">
        <Search size={14} />
        <span className="hidden sm:inline">Buscar</span>
        <kbd className="hidden rounded border border-border px-1 text-[11px] sm:inline">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto">
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut size={15} />
          <span className="hidden sm:inline">Salir</span>
        </Button>
      </div>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[260px] animate-fade-in bg-surface p-3 shadow-xl">
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-sm font-medium">Centro Personal</span>
              <button
                onClick={() => setOpen(false)}
                className="grid h-7 w-7 place-items-center rounded hover:bg-surface-2"
                aria-label="Cerrar menú"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="flex flex-col gap-0.5">
              {nav.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded px-2.5 py-2.5 text-sm",
                      active
                        ? "bg-surface-2 font-medium text-fg"
                        : "text-fg-muted hover:bg-surface-2"
                    )}
                  >
                    <Icon size={18} className={active ? "text-accent" : ""} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
