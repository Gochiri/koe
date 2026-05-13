"use client";

import type { Goal, Task, FocusSession } from "@/lib/db/goals-schema";
import { Target, CheckSquare, Clock, ListTodo } from "lucide-react";
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
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
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-0.5">{getGreeting()}</p>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Goals activos"
          value={String(activeGoals.length)}
          sub={`${completedGoalsThisMonth} completados este mes`}
          icon={Target}
          accent="violet"
        />
        <MetricCard
          label="Tasks hoy"
          value={String(tasksCompletedToday)}
          sub={`${tasksCompletedThisWeek} esta semana`}
          icon={CheckSquare}
          accent="emerald"
        />
        <MetricCard
          label="Focus semanal"
          value={`${weeklyFocusHours}h`}
          sub={`${weeklyFocusMinutes} minutos`}
          icon={Clock}
          accent="blue"
        />
        <MetricCard
          label="Pendientes"
          value={String(pendingTasks)}
          sub="tareas sin completar"
          icon={ListTodo}
          accent="amber"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <GoalProgressList goals={activeGoals} tasks={allTasks} />
        </div>
        <div className="lg:col-span-2">
          <TasksSummary tasks={allTasks} />
        </div>
      </div>

      {/* Focus chart */}
      <FocusChart focusByDay={focusByDay} />
    </div>
  );
}
