"use client";

import type { Task } from "@/lib/db/goals-schema";
import { TaskItem } from "@/components/frameworks/goals/task-item";

interface Props {
  tasks: Task[];
}

export function TasksParetoView({ tasks }: Props) {
  const highImpact = tasks.filter((t) => t.priority === "high" && t.status !== "done");

  if (highImpact.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-card/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground/35">
            The 20% that matters
          </span>
        </div>
        <p className="text-sm text-muted-foreground/50 py-2">
          No high-priority tasks pending — good work.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground/50">
          The 20% that matters
        </span>
        <span className="text-[10px] font-mono bg-foreground/8 border border-border/40 px-1.5 py-0.5 rounded text-foreground/50">
          {highImpact.length}
        </span>
      </div>
      <div className="space-y-0.5">
        {highImpact.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
