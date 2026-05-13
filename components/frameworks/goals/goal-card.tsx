"use client";

import { useState, useTransition } from "react";
import { deleteGoal, updateGoal, createTask } from "@/app/(dashboard)/goals/actions";
import { toast } from "sonner";
import type { Goal, Task } from "@/lib/db/goals-schema";
import { TaskItem } from "./task-item";
import { Pencil, Calendar } from "lucide-react";

interface Props {
  goal: Goal;
  tasks: Task[];
  allTasks?: Task[];
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  completed: "Completed",
  paused: "Paused",
};

const STATUS_STYLES: Record<string, string> = {
  active: "text-foreground/70",
  paused: "text-foreground/40",
  completed: "text-foreground/30 line-through",
};

const HORIZON_LABELS: Record<string, string> = {
  "90days": "90 Days",
  "1year": "1 Year",
  "3year": "3 Years",
  lifetime: "Lifetime",
};

function formatDate(d: string | null | undefined): string {
  if (!d) return "";
  // date column comes as YYYY-MM-DD string
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

export function GoalCard({ goal, tasks }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [, startTransition] = useTransition();

  // Edit form state — initialised from goal
  const [editTitle, setEditTitle] = useState(goal.title);
  const [editResult, setEditResult] = useState(goal.result ?? "");
  const [editPurpose, setEditPurpose] = useState(goal.purpose ?? "");
  const [editHorizon, setEditHorizon] = useState(goal.horizon);
  const [editDeadline, setEditDeadline] = useState(goal.deadline ?? "");
  const [editStatus, setEditStatus] = useState(goal.status);

  const done = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  function handleDelete() {
    const fd = new FormData();
    fd.set("id", String(goal.id));
    startTransition(async () => {
      try {
        await deleteGoal(fd);
      } catch {
        toast.error("Failed to delete goal");
      }
    });
  }

  function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editTitle.trim()) return;
    const fd = new FormData();
    fd.set("id", String(goal.id));
    fd.set("title", editTitle.trim());
    fd.set("result", editResult);
    fd.set("purpose", editPurpose);
    fd.set("horizon", editHorizon);
    fd.set("deadline", editDeadline);
    fd.set("status", editStatus);
    startTransition(async () => {
      try {
        await updateGoal(fd);
        setEditing(false);
      } catch {
        toast.error("Failed to update goal");
      }
    });
  }

  function handleEditCancel() {
    // Reset fields back to current goal values
    setEditTitle(goal.title);
    setEditResult(goal.result ?? "");
    setEditPurpose(goal.purpose ?? "");
    setEditHorizon(goal.horizon);
    setEditDeadline(goal.deadline ?? "");
    setEditStatus(goal.status);
    setEditing(false);
  }

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setAddingTask(false);
      return;
    }
    const fd = new FormData();
    fd.set("title", taskTitle.trim());
    fd.set("goalId", String(goal.id));
    fd.set("priority", taskPriority);
    startTransition(async () => {
      try {
        await createTask(fd);
        setTaskTitle("");
        setTaskPriority("medium");
        setAddingTask(false);
      } catch {
        toast.error("Failed to create task");
      }
    });
  }

  return (
    <div
      className={`rounded-xl border transition-colors ${
        goal.status === "completed" ? "border-border/40 opacity-70" : "border-border"
      }`}
    >
      {/* Header */}
      <div
        className="group flex items-start gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => !editing && setExpanded((v) => !v)}
      >
        {/* Expand chevron */}
        <span className="mt-1 text-muted-foreground text-xs shrink-0">
          {expanded ? "▼" : "▶"}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-medium text-sm ${
                STATUS_STYLES[goal.status] ?? "text-foreground/70"
              }`}
            >
              {goal.title}
            </span>
            {/* Status badge — mono/opacity only */}
            <span className="text-[10px] border border-border/50 px-1.5 py-0.5 rounded font-mono text-foreground/50">
              {STATUS_LABELS[goal.status]}
            </span>
            {/* Horizon badge */}
            {goal.horizon && (
              <span className="text-[10px] border border-border/30 px-1.5 py-0.5 rounded font-mono text-foreground/35">
                {HORIZON_LABELS[goal.horizon] ?? goal.horizon}
              </span>
            )}
            {/* Deadline */}
            {goal.deadline && (
              <span className="flex items-center gap-1 text-[10px] text-foreground/40">
                <Calendar className="w-3 h-3" />
                {formatDate(goal.deadline)}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-foreground/30 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {done}/{total}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing((v) => !v);
              if (!editing) setExpanded(true);
            }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground text-xs w-5 h-5 flex items-center justify-center rounded hover:bg-accent transition-colors"
            title="Edit goal"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs w-5 h-5 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors"
            title="Delete goal"
          >
            ×
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border/40 px-4 py-3 space-y-4">
          {/* Inline edit form */}
          {editing && (
            <form
              onSubmit={handleEditSave}
              onClick={(e) => e.stopPropagation()}
              className="space-y-3 pb-3 border-b border-border/30"
            >
              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                  Title
                </label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:border-ring/60"
                  required
                />
              </div>

              {/* Result */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                  Result
                </label>
                <textarea
                  value={editResult}
                  onChange={(e) => setEditResult(e.target.value)}
                  rows={2}
                  placeholder="What specific result do you want?"
                  className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:border-ring/60 resize-none"
                />
              </div>

              {/* Purpose */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                  Why it matters
                </label>
                <textarea
                  value={editPurpose}
                  onChange={(e) => setEditPurpose(e.target.value)}
                  rows={2}
                  placeholder="Why does this goal matter?"
                  className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:border-ring/60 resize-none"
                />
              </div>

              {/* Horizon + Status row */}
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                    Horizon
                  </label>
                  <select
                    value={editHorizon}
                    onChange={(e) => setEditHorizon(e.target.value)}
                    className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:border-ring/60"
                  >
                    <option value="90days">90 Days</option>
                    <option value="1year">1 Year</option>
                    <option value="3year">3 Years</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:border-ring/60"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Deadline */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                  Deadline
                </label>
                <input
                  type="date"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:border-ring/60"
                />
              </div>

              {/* Save / Cancel */}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="text-xs px-3 py-1.5 rounded-lg border border-border/60 bg-foreground/5 hover:bg-foreground/10 transition-colors font-medium"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleEditCancel}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border/30 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Result & Purpose (read-only, shown when not editing) */}
          {!editing && (goal.result || goal.purpose) && (
            <div className="space-y-2 text-sm text-muted-foreground">
              {goal.result && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 block mb-0.5">
                    Result
                  </span>
                  <p className="leading-relaxed">{goal.result}</p>
                </div>
              )}
              {goal.purpose && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 block mb-0.5">
                    Why it matters
                  </span>
                  <p className="leading-relaxed">{goal.purpose}</p>
                </div>
              )}
            </div>
          )}

          {/* Tasks */}
          <div className="space-y-1">
            {tasks.length > 0 && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
                Tasks
              </p>
            )}
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}

            {/* Add task form */}
            {addingTask ? (
              <form onSubmit={handleAddTask} className="mt-2 space-y-2">
                <input
                  autoFocus
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="New task..."
                  className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:border-ring/60"
                  onBlur={() => {
                    if (!taskTitle.trim()) setAddingTask(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setAddingTask(false);
                      setTaskTitle("");
                    }
                  }}
                />
                <div className="flex items-center gap-2">
                  <select
                    value={taskPriority}
                    onChange={(e) =>
                      setTaskPriority(e.target.value as "high" | "medium" | "low")
                    }
                    className="text-xs rounded-lg border border-border bg-background px-2 py-1 focus:outline-none focus:border-ring/60"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <button
                    type="submit"
                    className="text-xs px-2 py-1 rounded border border-border/50 text-foreground/60 hover:text-foreground transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingTask(false);
                      setTaskTitle("");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
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
