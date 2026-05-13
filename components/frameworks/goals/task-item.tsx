"use client";

import { useTransition } from "react";
import { updateTask, deleteTask } from "@/app/(dashboard)/goals/actions";
import { toast } from "sonner";
import type { Task } from "@/lib/db/goals-schema";

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500/15 text-red-600 dark:text-red-400",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  low: "bg-slate-500/15 text-slate-500",
};

interface Props {
  task: Task;
}

export function TaskItem({ task }: Props) {
  const [, startTransition] = useTransition();

  function toggleDone() {
    const fd = new FormData();
    fd.set("id", String(task.id));
    fd.set("status", task.status === "done" ? "todo" : "done");
    startTransition(async () => {
      try { await updateTask(fd); }
      catch { toast.error("Failed to update task"); }
    });
  }

  function handleDelete() {
    const fd = new FormData();
    fd.set("id", String(task.id));
    startTransition(async () => {
      try { await deleteTask(fd); }
      catch { toast.error("Failed to delete task"); }
    });
  }

  return (
    <div className="group flex items-center gap-2.5 py-1 px-1 rounded-lg hover:bg-accent/30 transition-colors">
      {/* Checkbox */}
      <button
        onClick={toggleDone}
        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
          task.status === "done"
            ? "bg-primary border-primary text-primary-foreground"
            : "border-border hover:border-primary"
        }`}
      >
        {task.status === "done" && <span className="text-[8px]">✓</span>}
      </button>

      {/* Title */}
      <span className={`flex-1 text-sm ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
        {task.title}
      </span>

      {/* Priority */}
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority] ?? ""}`}>
        {task.priority}
      </span>

      {/* Delete */}
      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs w-4 h-4 flex items-center justify-center"
      >
        ×
      </button>
    </div>
  );
}
