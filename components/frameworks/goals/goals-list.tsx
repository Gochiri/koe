"use client";

import { useState, useTransition } from "react";
import { createGoal } from "@/app/(dashboard)/goals/actions";
import { toast } from "sonner";
import type { Goal, Task } from "@/lib/db/goals-schema";
import { GoalCard } from "./goal-card";

interface Props {
  goals: Goal[];
  tasks: Task[];
  horizon: string;
}

export function GoalsList({ goals, tasks, horizon }: Props) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setAdding(false); return; }
    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("horizon", horizon);
    startTransition(async () => {
      try {
        await createGoal(fd);
        setTitle("");
        setAdding(false);
      } catch {
        toast.error("Failed to create goal");
      }
    });
  }

  return (
    <div className="space-y-3 max-w-3xl">
      {goals.length === 0 && !adding && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <span className="text-4xl">🎯</span>
          <p className="text-sm">No goals for this horizon yet</p>
          <button
            onClick={() => { setAdding(true); }}
            className="text-sm text-primary hover:underline"
          >
            + Create first goal
          </button>
        </div>
      )}

      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} tasks={tasks.filter((t) => t.goalId === goal.id)} allTasks={tasks} />
      ))}

      {/* Add goal form */}
      {adding ? (
        <form onSubmit={handleCreate} className="mt-2">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Goal name..."
            className="w-full text-sm rounded-lg border border-border bg-card px-3 py-2 focus:outline-none focus:border-ring/60"
            onBlur={() => { if (!title.trim()) setAdding(false); }}
            onKeyDown={(e) => { if (e.key === "Escape") { setAdding(false); setTitle(""); } }}
          />
        </form>
      ) : goals.length > 0 ? (
        <button
          onClick={() => setAdding(true)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-1 py-1"
        >
          <span className="text-lg leading-none">+</span> Add goal
        </button>
      ) : null}
    </div>
  );
}
