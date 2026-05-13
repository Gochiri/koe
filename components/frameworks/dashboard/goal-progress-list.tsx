import type { Goal, Task } from "@/lib/db/goals-schema";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  goals: Goal[];
  tasks: Task[];
}

const HORIZON_LABELS: Record<string, string> = {
  "90days": "90 days",
  "1year":  "1 year",
  "3year":  "3 years",
  "lifetime": "Lifetime",
};

const HORIZON_COLORS: Record<string, string> = {
  "90days":   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "1year":    "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "3year":    "text-violet-400 bg-violet-500/10 border-violet-500/20",
  "lifetime": "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

const PROGRESS_COLORS: Record<string, string> = {
  "90days":   "bg-emerald-500",
  "1year":    "bg-blue-500",
  "3year":    "bg-violet-500",
  "lifetime": "bg-amber-500",
};

export function GoalProgressList({ goals, tasks }: Props) {
  if (goals.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-5 py-5 h-full">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Target className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Active goals</h3>
            <p className="text-[10px] text-muted-foreground/50">Your current progress</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <p className="text-sm text-muted-foreground">No active goals yet</p>
          <p className="text-xs text-muted-foreground/50">Create your first goal in the Goals section</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card px-5 py-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <Target className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Active goals</h3>
          <p className="text-[10px] text-muted-foreground/50">{goals.length} in progress</p>
        </div>
      </div>

      <div className="space-y-4">
        {goals.slice(0, 6).map((goal) => {
          const goalTasks = tasks.filter((t) => t.goalId === goal.id);
          const done = goalTasks.filter((t) => t.status === "done").length;
          const total = goalTasks.length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const barColor = PROGRESS_COLORS[goal.horizon] ?? "bg-primary";
          const horizonStyle = HORIZON_COLORS[goal.horizon] ?? "text-muted-foreground bg-muted border-border";

          return (
            <div key={goal.id} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn(
                    "text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full border flex-shrink-0",
                    horizonStyle
                  )}>
                    {HORIZON_LABELS[goal.horizon] ?? goal.horizon}
                  </span>
                  <span className="text-sm truncate">{goal.title}</span>
                </div>
                <span className="text-xs font-semibold text-muted-foreground flex-shrink-0 ml-2">{pct}%</span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", barColor)}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <p className="text-[10px] text-muted-foreground/40 mt-1">
                {done}/{total} tasks completed
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
