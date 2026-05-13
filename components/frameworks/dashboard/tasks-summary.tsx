import type { Task } from "@/lib/db/goals-schema";
import { ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  tasks: Task[];
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; bar: string }> = {
  todo:        { label: "To do",       dot: "bg-slate-400",   bar: "bg-slate-400" },
  in_progress: { label: "In progress", dot: "bg-blue-400",    bar: "bg-blue-400" },
  done:        { label: "Completed",   dot: "bg-emerald-500", bar: "bg-emerald-500" },
  blocked:     { label: "Blocked",     dot: "bg-red-400",     bar: "bg-red-400" },
};

const PRIORITY_CONFIG: Record<string, { label: string; style: string; valueStyle: string }> = {
  high:   {
    label: "High",
    style: "bg-red-500/8 border border-red-500/15",
    valueStyle: "text-red-400",
  },
  medium: {
    label: "Medium",
    style: "bg-amber-500/8 border border-amber-500/15",
    valueStyle: "text-amber-400",
  },
  low: {
    label: "Low",
    style: "bg-slate-500/8 border border-slate-500/15",
    valueStyle: "text-slate-400",
  },
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
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const completionPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-card px-5 py-5 h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <ListTodo className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Tasks</h3>
          <p className="text-[10px] text-muted-foreground/50">{completionPct}% completed</p>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="space-y-2.5 mb-5">
        {byStatus.map(({ key, count }) => {
          const cfg = STATUS_CONFIG[key];
          return (
            <div key={key} className="flex items-center gap-2.5">
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", cfg.dot)} />
              <span className="text-xs text-muted-foreground flex-1">{cfg.label}</span>
              <span className="text-xs font-semibold tabular-nums">{count}</span>
              {total > 0 && (
                <div className="w-14 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", cfg.bar)}
                    style={{ width: `${(count / total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-border/60 mb-4" />

      {/* Priority */}
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-2.5">
        Pending by priority
      </p>
      <div className="grid grid-cols-3 gap-2">
        {byPriority.map(({ key, count }) => {
          const cfg = PRIORITY_CONFIG[key];
          return (
            <div key={key} className={cn("rounded-lg px-2 py-2.5 text-center", cfg.style)}>
              <p className={cn("text-xl font-bold tabular-nums", cfg.valueStyle)}>{count}</p>
              <p className="text-[10px] text-muted-foreground/60 font-medium mt-0.5">{cfg.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
