import type { Task } from "@/lib/db/goals-schema";
import { ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  tasks: Task[];
}

// Monochrome opacity scale — no colors, hierarchy through brightness
const STATUS_CONFIG: Record<string, { label: string; dot: string; bar: string }> = {
  todo:        { label: "To do",       dot: "bg-foreground/20", bar: "bg-foreground/20" },
  in_progress: { label: "In progress", dot: "bg-foreground/55", bar: "bg-foreground/55" },
  done:        { label: "Completed",   dot: "bg-foreground/85", bar: "bg-foreground/85" },
  blocked:     { label: "Blocked",     dot: "bg-foreground/15", bar: "bg-foreground/15" },
};

const PRIORITY_CONFIG: Record<string, { label: string; style: string; valueStyle: string }> = {
  high:   {
    label: "High",
    style: "bg-foreground/[0.06] border border-foreground/10",
    valueStyle: "text-foreground/75",
  },
  medium: {
    label: "Med",
    style: "bg-foreground/[0.04] border border-foreground/8",
    valueStyle: "text-foreground/55",
  },
  low: {
    label: "Low",
    style: "bg-foreground/[0.03] border border-foreground/6",
    valueStyle: "text-foreground/35",
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
      <div className="flex items-center gap-2 mb-5">
        <ListTodo className="w-3.5 h-3.5 text-muted-foreground/40" />
        <h3 className="text-sm font-semibold">Tasks</h3>
        <span className="text-[10px] text-muted-foreground/35 font-medium ml-auto tabular-nums">
          {completionPct}% done
        </span>
      </div>

      {/* Status breakdown */}
      <div className="space-y-2.5 mb-5">
        {byStatus.map(({ key, count }) => {
          const cfg = STATUS_CONFIG[key];
          return (
            <div key={key} className="flex items-center gap-2.5">
              <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />
              <span className="text-[12px] text-muted-foreground/60 flex-1">{cfg.label}</span>
              <span className="text-[12px] font-semibold tabular-nums text-foreground/70">{count}</span>
              {total > 0 && (
                <div className="w-14 h-[2px] bg-foreground/[0.07] rounded-full overflow-hidden">
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
      <div className="border-t border-border/50 mb-4" />

      {/* Priority */}
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/30 mb-3">
        Pending by priority
      </p>
      <div className="grid grid-cols-3 gap-2">
        {byPriority.map(({ key, count }) => {
          const cfg = PRIORITY_CONFIG[key];
          return (
            <div key={key} className={cn("rounded-lg px-2 py-2.5 text-center", cfg.style)}>
              <p className={cn("text-xl font-bold tabular-nums leading-none", cfg.valueStyle)}>{count}</p>
              <p className="text-[9px] text-muted-foreground/40 font-medium mt-1.5">{cfg.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
