"use client";

import { cn } from "@/lib/utils/cn";
import { TASK_COLUMNS, TASK_STATUS_LABELS, type Task, type TaskStatus } from "./types";
import { useState } from "react";

const priorityDot: Record<Task["priority"], string> = {
  low: "bg-fg-subtle",
  medium: "bg-accent",
  high: "bg-warning",
  urgent: "bg-danger",
};

export function KanbanView({
  tasks,
  onOpen,
  onMove,
}: {
  tasks: Task[];
  onOpen: (t: Task) => void;
  onMove: (taskId: string, status: TaskStatus) => void;
}) {
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {TASK_COLUMNS.map((col) => {
        const items = tasks.filter((t) => t.status === col);
        return (
          <div
            key={col}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(col);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/plain");
              if (id) onMove(id, col);
              setDragOver(null);
            }}
            className={cn(
              "rounded-xl border p-2.5 transition-colors",
              dragOver === col
                ? "border-accent bg-accent-soft"
                : "border-border bg-surface-2"
            )}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[13px] font-medium">
                {TASK_STATUS_LABELS[col]}
              </span>
              <span className="text-xs text-fg-subtle">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
                  onClick={() => onOpen(t)}
                  className="cursor-pointer rounded-lg border border-border bg-surface p-2.5 text-left transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                        priorityDot[t.priority]
                      )}
                    />
                    <p className="text-[13px] leading-snug">{t.title}</p>
                  </div>
                  {t.due_date && (
                    <p className="mt-1.5 pl-3.5 text-xs text-fg-subtle">
                      {new Intl.DateTimeFormat("es-AR", {
                        day: "numeric",
                        month: "short",
                      }).format(new Date(t.due_date))}
                    </p>
                  )}
                </div>
              ))}
              {items.length === 0 && (
                <p className="px-1 py-4 text-center text-xs text-fg-subtle">
                  —
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
