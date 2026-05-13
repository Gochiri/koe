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
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
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
    <div className="max-w-5xl mx-auto py-8 px-6 space-y-7">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground/45 uppercase tracking-[0.1em] mb-1">{getGreeting()}</p>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        </div>
        <p className="text-[11px] text-muted-foreground/40 tabular-nums">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Active goals"
          value={String(activeGoals.length)}
          sub={`${completedGoalsThisMonth} completed this month`}
          icon={Target}
          accent="violet"
        />
        <MetricCard
          label="Tasks today"
          value={String(tasksCompletedToday)}
          sub={`${tasksCompletedThisWeek} this week`}
          icon={CheckSquare}
          accent="emerald"
        />
        <MetricCard
          label="Weekly focus"
          value={`${weeklyFocusHours}h`}
          sub={`${weeklyFocusMinutes} minutes`}
          icon={Clock}
          accent="blue"
        />
        <MetricCard
          label="Pending"
          value={String(pendingTasks)}
          sub="tasks remaining"
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
