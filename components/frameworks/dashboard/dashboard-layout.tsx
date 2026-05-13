"use client";

import type { Goal, Task, FocusSession } from "@/lib/db/goals-schema";
import { Target, CheckSquare, Clock, ListTodo } from "lucide-react";
import { MetricCard } from "./metric-card";
import { GoalProgressList } from "./goal-progress-list";
import { FocusChart } from "./focus-chart";
import { TasksSummary } from "./tasks-summary";
import { ProductivityScore } from "./productivity-score";
import { Achievements } from "./achievements";

interface Props {
  activeGoals: Goal[];
  allTasks: Task[];
  completedGoalsThisMonth: number;
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  weeklyFocusMinutes: number;
  focusByDay: Record<string, number>;
  recentSessions: FocusSession[];
  productivityScore: number;
  previousScore: number;
  highImpactTotal: number;
  highImpactCompleted: number;
  streak: number;
  completedGoals: number;
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
  productivityScore,
  previousScore,
  streak,
  completedGoals,
  recentSessions,
}: Props) {
  const weeklyFocusHours = (weeklyFocusMinutes / 60).toFixed(1);
  const pendingTasks = allTasks.filter((t) => t.status !== "done").length;
  const allTasksDone = allTasks.filter((t) => t.status === "done").length;

  const achievements = [
    { id: "first_session",  title: "Primera sesión",   description: "Completa tu primera sesión de enfoque",   unlocked: recentSessions.length > 0 || completedGoals > 0 },
    { id: "streak_3",       title: "3 días seguidos",  description: "Enfocate 3 días consecutivos",             unlocked: streak >= 3 },
    { id: "streak_7",       title: "Semana completa",  description: "Enfocate 7 días consecutivos",             unlocked: streak >= 7 },
    { id: "focus_hour",     title: "1 hora de poder",  description: "Acumula 1+ hora de enfoque esta semana",   unlocked: weeklyFocusMinutes >= 60 },
    { id: "ten_tasks",      title: "Máquina de tareas",description: "Completa 10 tareas en total",              unlocked: allTasksDone >= 10 },
    { id: "goal_crusher",   title: "Meta cumplida",    description: "Completa al menos una meta",               unlocked: completedGoals >= 1 },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 space-y-7">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground/45 uppercase tracking-[0.1em] mb-1">{getGreeting()}</p>
          <h1 className="text-xl font-semibold tracking-tight">Inicio</h1>
        </div>
        <p className="text-[11px] text-muted-foreground/40 tabular-nums">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* Score + Achievements row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ProductivityScore score={productivityScore} previousScore={previousScore} />
        </div>
        <div className="lg:col-span-3">
          <Achievements achievements={achievements} />
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Metas activas"
          value={String(activeGoals.length)}
          sub={`${completedGoalsThisMonth} completadas este mes`}
          icon={Target}
          accent="violet"
        />
        <MetricCard
          label="Tareas hoy"
          value={String(tasksCompletedToday)}
          sub={`${tasksCompletedThisWeek} esta semana`}
          icon={CheckSquare}
          accent="emerald"
        />
        <MetricCard
          label="Enfoque semanal"
          value={`${weeklyFocusHours}h`}
          sub={`${weeklyFocusMinutes} minutos`}
          icon={Clock}
          accent="blue"
        />
        <MetricCard
          label="Pendientes"
          value={String(pendingTasks)}
          sub="tareas restantes"
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
