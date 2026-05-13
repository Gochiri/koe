import type { Task } from "@/lib/db/goals-schema";

interface Props {
  tasks: Task[];
}

const STATUS_LABELS: Record<string, string> = {
  todo: "Por hacer",
  in_progress: "En progreso",
  done: "Completadas",
  blocked: "Bloqueadas",
};

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-slate-400",
  in_progress: "bg-blue-500",
  done: "bg-emerald-500",
  blocked: "bg-red-400",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500/15 text-red-600 dark:text-red-400",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  low: "bg-slate-500/15 text-slate-500",
};

export function TasksSummary({ tasks }: Props) {
  const byStatus = ["todo", "in_progress", "done", "blocked"].map((s) => ({
    key: s,
    count: tasks.filter((t) => t.status === s).length,
  }));

  const byPriority = ["high", "medium", "low"].map((p) => ({
    key: p,
    count: tasks.filter((t) => t.priority === p && t.status !== "done").length,
  }));

  const total = tasks.length;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <h3 className="text-sm font-semibold mb-3">Tareas</h3>

      {/* Status breakdown */}
      <div className="space-y-2 mb-4">
        {byStatus.map(({ key, count }) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[key]}`} />
            <span className="text-sm flex-1">{STATUS_LABELS[key]}</span>
            <span className="text-sm font-medium">{count}</span>
            {total > 0 && (
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${STATUS_COLORS[key]}`}
                  style={{ width: `${(count / total) * 100}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Priority of pending tasks */}
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
        Pendientes por prioridad
      </p>
      <div className="flex gap-2">
        {byPriority.map(({ key, count }) => (
          <div key={key} className={`flex-1 rounded-lg px-2 py-1.5 text-center ${PRIORITY_COLORS[key]}`}>
            <p className="text-lg font-bold">{count}</p>
            <p className="text-[10px] font-medium">{PRIORITY_LABELS[key]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
