import type { Goal, Task } from "@/lib/db/goals-schema";
import { Target } from "lucide-react";

interface Props {
  goals: Goal[];
  tasks: Task[];
}

const HORIZON_LABELS: Record<string, string> = {
  "90days":   "90d",
  "1year":    "1yr",
  "3year":    "3yr",
  "lifetime": "∞",
};

export function GoalProgressList({ goals, tasks }: Props) {
  if (goals.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-5 py-5 h-full">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-3.5 h-3.5 text-muted-foreground/40" />
          <h3 className="text-sm font-semibold">Active goals</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <p className="text-sm text-muted-foreground/60">No active goals yet</p>
          <p className="text-xs text-muted-foreground/35">Create your first goal in Goals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card px-5 py-5 h-full">
      <div className="flex items-center gap-2 mb-5">
        <Target className="w-3.5 h-3.5 text-muted-foreground/40" />
        <h3 className="text-sm font-semibold">Active goals</h3>
        <span className="text-[10px] text-muted-foreground/35 font-medium ml-auto">{goals.length} in progress</span>
      </div>

      <div className="space-y-5">
        {goals.slice(0, 6).map((goal) => {
          const goalTasks = tasks.filter((t) => t.goalId === goal.id);
          const done = goalTasks.filter((t) => t.status === "done").length;
          const total = goalTasks.length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <div key={goal.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/35 flex-shrink-0 w-7">
                    {HORIZON_LABELS[goal.horizon] ?? goal.horizon}
                  </span>
                  <span className="text-[13px] truncate text-foreground/85">{goal.title}</span>
                </div>
                <span className="text-[11px] font-semibold tabular-nums text-muted-foreground/50 flex-shrink-0 ml-3">
                  {pct}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-[3px] bg-foreground/[0.07] rounded-full overflow-hidden">
                <div
                  className="h-full bg-foreground/55 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <p className="text-[10px] text-muted-foreground/30 mt-1.5 tabular-nums">
                {done}/{total} tasks
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
