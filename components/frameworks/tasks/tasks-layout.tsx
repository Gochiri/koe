"use client";

import { useState } from "react";
import type { Task, Goal } from "@/lib/db/goals-schema";
import { TaskItem } from "@/components/frameworks/goals/task-item";
import { TasksParetoView } from "./tasks-pareto-view";
import { StandaloneTaskForm } from "./standalone-task-form";
import { TasksKanban } from "./tasks-kanban";
import { LayoutList, Columns3 } from "lucide-react";

interface Props {
  tasks: Task[];
  goals: Goal[];
}

type Filter = "all" | "todo" | "in_progress" | "done";
type ViewMode = "list" | "kanban";

const FILTER_LABELS: Record<Filter, string> = {
  all: "Todas",
  todo: "Por hacer",
  in_progress: "En progreso",
  done: "Listo",
};

export function TasksLayout({ tasks, goals }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const visible = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
  const pending = tasks.filter((t) => t.status !== "done").length;
  const done = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground/45 uppercase tracking-[0.1em] mb-1">Tareas</p>
          <h1 className="text-xl font-semibold tracking-tight">Todas las tareas</h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-[11px] text-muted-foreground/40 tabular-nums">
            {pending} pendientes · {done} listas
          </p>
          {/* View toggle */}
          <div className="flex items-center gap-0.5 rounded-lg border border-border/60 p-0.5 bg-muted/30">
            <button
              onClick={() => setViewMode("list")}
              title="Vista lista"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              title="Vista kanban"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "kanban" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === "kanban" ? (
        /* ── Kanban ── */
        <TasksKanban tasks={tasks} />
      ) : (
        /* ── List ── */
        <>
          {/* Pareto section */}
          <TasksParetoView tasks={tasks} />

          {/* Filter tabs */}
          <div className="flex items-center gap-1">
            {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-foreground/10 text-foreground border border-border/60"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-foreground/5"
                }`}
              >
                {FILTER_LABELS[f]}
                {f !== "all" && (
                  <span className="ml-1.5 opacity-60 tabular-nums">
                    {tasks.filter((t) => t.status === f).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tasks list */}
          <div className="rounded-xl border border-border bg-card divide-y divide-border/30">
            {visible.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground/50">
                Todavía no hay tareas aquí
              </div>
            ) : (
              <div className="px-3 py-2 space-y-0.5">
                {visible.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>

          {/* Add task form */}
          <StandaloneTaskForm goals={goals} />
        </>
      )}
    </div>
  );
}
