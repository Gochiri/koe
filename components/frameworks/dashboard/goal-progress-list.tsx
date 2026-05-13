import type { Goal, Task } from "@/lib/db/goals-schema";

interface Props {
  goals: Goal[];
  tasks: Task[];
}

export function GoalProgressList({ goals, tasks }: Props) {
  if (goals.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-6">
        <h3 className="text-sm font-semibold mb-3">Goals activos</h3>
        <p className="text-sm text-muted-foreground">Sin goals activos. ¡Creá uno en Goals!</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <h3 className="text-sm font-semibold mb-3">Goals activos</h3>
      <div className="space-y-3">
        {goals.slice(0, 6).map((goal) => {
          const goalTasks = tasks.filter((t) => t.goalId === goal.id);
          const done = goalTasks.filter((t) => t.status === "done").length;
          const total = goalTasks.length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <div key={goal.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm truncate max-w-[200px]">{goal.title}</span>
                <span className="text-xs text-muted-foreground">{pct}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                {done}/{total} tareas · {goal.horizon}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
