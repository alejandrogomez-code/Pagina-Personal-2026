"use client";

import { cn } from "@/lib/utils/cn";
import { X } from "lucide-react";
import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-label={title}
        className={cn(
          "relative w-full animate-fade-in rounded-t-xl border border-border bg-surface shadow-xl",
          "sm:max-w-md sm:rounded-xl",
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-medium">{title}</h2>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded text-fg-subtle hover:bg-surface-2 hover:text-fg"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
