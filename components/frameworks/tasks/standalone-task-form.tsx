"use client";

import { useState, useTransition } from "react";
import { createTask } from "@/app/(dashboard)/goals/actions";
import { toast } from "sonner";
import type { Goal } from "@/lib/db/goals-schema";

interface Props {
  goals: Goal[];
}

export function StandaloneTaskForm({ goals }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [deadline, setDeadline] = useState("");
  const [goalId, setGoalId] = useState("");
  const [, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setOpen(false); return; }
    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("priority", priority);
    if (deadline) fd.set("deadline", deadline);
    if (goalId) fd.set("goalId", goalId);
    startTransition(async () => {
      try {
        await createTask(fd);
        setTitle("");
        setPriority("medium");
        setDeadline("");
        setGoalId("");
        setOpen(false);
      } catch {
        toast.error("No se pudo crear la tarea");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5"
      >
        <span className="text-base leading-none">+</span> Nueva tarea
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border/60 rounded-xl p-4 space-y-3 bg-card">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título de la tarea..."
        onKeyDown={(e) => { if (e.key === "Escape") { setOpen(false); setTitle(""); } }}
        className="w-full text-sm bg-transparent border-b border-border focus:outline-none focus:border-foreground/40 pb-1"
      />
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as "high" | "medium" | "low")}
          className="text-xs rounded-lg border border-border bg-background px-2 py-1 focus:outline-none"
        >
          <option value="high">Alta prioridad</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="text-xs rounded-lg border border-border bg-background px-2 py-1 focus:outline-none text-muted-foreground"
        />
        {goals.length > 0 && (
          <select
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            className="text-xs rounded-lg border border-border bg-background px-2 py-1 focus:outline-none flex-1 min-w-0"
          >
            <option value="">Sin meta</option>
            {goals.map((g) => (
              <option key={g.id} value={String(g.id)}>{g.title}</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="text-xs px-3 py-1.5 rounded-lg border border-border/60 bg-foreground/5 hover:bg-foreground/10 transition-colors font-medium"
        >
          Agregar tarea
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setTitle(""); }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
