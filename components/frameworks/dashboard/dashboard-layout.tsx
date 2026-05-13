"use client";

import type { Goal, Task, FocusSession } from "@/lib/db/goals-schema";
import { MetricCard } from "./metric-card";
import { GoalProgressList } from "./goal-progress-list";
import { FocusChart } from "./focus-chart";
import { TasksSummary } from "./tasks-summary";

interface Props {
  activeGoals: Goal[];
  allTasks: Task[];
  completedGoalsThisMonth: number;
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  weeklyFocusMinutes: number;
  focusByDay: Record<string, number>;
  recentSessions: FocusSession[];
}

export function DashboardLayout({
  activeGoals,
  allTasks,
  completedGoalsThisMonth,
  tasksCompletedToday,
  tasksCompletedThisWeek,
  weeklyFocusMinutes,
  focusByDay,
}: Props) {
  const weeklyFocusHours = (weeklyFocusMinutes / 60).toFixed(1);
  const pendingTasks = allTasks.filter((t) => t.status !== "done").length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6 px-4">
      <div>
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Tu resumen de productividad</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Goals activos"
          value={String(activeGoals.length)}
          sub={`${completedGoalsThisMonth} completados este mes`}
          icon="🎯"
        />
        <MetricCard
          label="Tasks hoy"
          value={String(tasksCompletedToday)}
          sub={`${tasksCompletedThisWeek} esta semana`}
          icon="✅"
        />
        <MetricCard
          label="Focus semanal"
          value={`${weeklyFocusHours}h`}
          sub={`${weeklyFocusMinutes} minutos`}
          icon="⏱️"
        />
        <MetricCard
          label="Pendientes"
          value={String(pendingTasks)}
          sub="tareas sin completar"
          icon="📋"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Goals progress */}
        <GoalProgressList goals={activeGoals} tasks={allTasks} />

        {/* Tasks summary */}
        <TasksSummary tasks={allTasks} />
      </div>

      {/* Focus chart */}
      <FocusChart focusByDay={focusByDay} />
    </div>
  );
}
