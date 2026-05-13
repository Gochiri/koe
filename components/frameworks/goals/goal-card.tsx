"use client";

import { useState, useTransition } from "react";
import { deleteGoal, updateGoal, createTask } from "@/app/(dashboard)/goals/actions";
import { toast } from "sonner";
import type { Goal, Task } from "@/lib/db/goals-schema";
import { TaskItem } from "./task-item";

interface Props {
  goal: Goal;
  tasks: Task[];       // tasks for this goal
  allTasks: Task[];    // all user tasks (for context)
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  completed: "Completed",
  paused: "Paused",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  completed: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  paused: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

export function GoalCard({ goal, tasks }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [, startTransition] = useTransition();

  const done = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  function handleDelete() {
    const fd = new FormData();
    fd.set("id", String(goal.id));
    startTransition(async () => {
      try { await deleteGoal(fd); }
      catch { toast.error("Failed to delete goal"); }
    });
  }

  function handleStatusToggle() {
    const fd = new FormData();
    fd.set("id", String(goal.id));
    fd.set("status", goal.status === "active" ? "completed" : "active");
    startTransition(async () => {
      try { await updateGoal(fd); }
      catch { toast.error("Failed to update goal"); }
    });
  }

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) { setAddingTask(false); return; }
    const fd = new FormData();
    fd.set("title", taskTitle.trim());
    fd.set("goalId", String(goal.id));
    startTransition(async () => {
      try {
        await createTask(fd);
        setTaskTitle("");
        setAddingTask(false);
      } catch {
        toast.error("Failed to create task");
      }
    });
  }

  return (
    <div className={`rounded-xl border transition-colors ${goal.status === "completed" ? "border-border/40 opacity-70" : "border-border"}`}>
      {/* Header */}
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); handleStatusToggle(); }}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            goal.status === "completed"
              ? "bg-sky-500 border-sky-500 text-white"
              : "border-border hover:border-primary"
          }`}
        >
          {goal.status === "completed" && <span className="text-[10px]">✓</span>}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium text-sm ${goal.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
              {goal.title}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[goal.status] ?? ""}`}>
              {STATUS_LABELS[goal.status]}
            </span>
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{done}/{total}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-muted-foreground text-xs">{expanded ? "▼" : "▶"}</span>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs w-5 h-5 flex items-center justify-center rounded hover:bg-destructive/10"
          >
            ×
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border/40 px-4 py-3 space-y-3">
          {/* Result & Purpose */}
          {(goal.result || goal.purpose) && (
            <div className="space-y-2 text-sm text-muted-foreground">
              {goal.result && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 block mb-0.5">Result</span>
                  <p className="leading-relaxed">{goal.result}</p>
                </div>
              )}
              {goal.purpose && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 block mb-0.5">Why it matters</span>
                  <p className="leading-relaxed">{goal.purpose}</p>
                </div>
              )}
            </div>
          )}

          {/* Tasks */}
          <div className="space-y-1">
            {tasks.length > 0 && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">Tasks</p>
            )}
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
            {addingTask ? (
              <form onSubmit={handleAddTask} className="mt-2">
                <input
                  autoFocus
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="New task..."
                  className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:border-ring/60"
                  onBlur={() => { if (!taskTitle.trim()) setAddingTask(false); }}
                  onKeyDown={(e) => { if (e.key === "Escape") { setAddingTask(false); setTaskTitle(""); } }}
                />
              </form>
            ) : (
              <button
                onClick={() => setAddingTask(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 py-1"
              >
                <span className="text-base leading-none">+</span> Add task
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
