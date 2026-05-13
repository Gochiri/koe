"use client";

import { useState } from "react";
import type { Goal, Task, Milestone } from "@/lib/db/goals-schema";
import { GoalsList } from "./goals-list";
import { GoalsKanban } from "./goals-kanban";
import { GoalChat } from "./goal-chat";
import { LayoutList, Columns3 } from "lucide-react";

interface Props {
  goals: Goal[];
  tasks: Task[];
  milestones: Milestone[];
}

const HORIZONS = [
  { key: "90days",   label: "90 Días" },
  { key: "1year",    label: "1 Año" },
  { key: "3year",    label: "3 Años" },
  { key: "lifetime", label: "Vida" },
] as const;

type ViewMode = "list" | "kanban";

export function GoalsLayout({ goals, tasks, milestones }: Props) {
  const [activeHorizon, setActiveHorizon] = useState<string>("90days");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const filteredGoals = viewMode === "list"
    ? goals.filter((g) => g.horizon === activeHorizon)
    : goals;

  const activeGoals = goals.filter((g) => g.status === "active");

  return (
    <div className="flex overflow-hidden rounded-xl border border-border/60 h-full">
      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 bg-background">
        {/* Header bar */}
        <div className="flex items-center gap-1 px-4 py-3 border-b border-border/60 bg-background/80 shrink-0">
          {/* Horizon tabs — only shown in list mode */}
          {viewMode === "list" && HORIZONS.map((h) => {
            const count = goals.filter((g) => g.horizon === h.key).length;
            return (
              <button
                key={h.key}
                onClick={() => setActiveHorizon(h.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeHorizon === h.key
                    ? "bg-foreground/10 text-foreground border border-border/60"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                }`}
              >
                {h.label}
                {count > 0 && (
                  <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${
                    activeHorizon === h.key
                      ? "bg-foreground/10 text-foreground/60"
                      : "bg-muted text-muted-foreground/60"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
          {viewMode === "kanban" && (
            <span className="text-sm font-medium text-foreground/60 px-1">Todas las metas</span>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* View toggle */}
          <div className="flex items-center gap-0.5 rounded-lg border border-border/60 p-0.5 bg-muted/30">
            <button
              onClick={() => setViewMode("list")}
              title="List view"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              title="Kanban view"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "kanban" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4">
          {viewMode === "list" ? (
            <GoalsList
              goals={filteredGoals}
              tasks={tasks}
              milestones={milestones}
              horizon={activeHorizon}
            />
          ) : (
            <GoalsKanban
              goals={filteredGoals}
              tasks={tasks}
              milestones={milestones}
            />
          )}
        </div>
      </div>

      {/* AI Coach panel */}
      <GoalChat goals={activeGoals} tasks={tasks} />
    </div>
  );
}
