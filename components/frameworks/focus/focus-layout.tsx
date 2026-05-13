"use client";

import type { Goal, Task, FocusSession } from "@/lib/db/goals-schema";
import { FocusTimer } from "./focus-timer";
import { SessionHistory } from "./session-history";
import { StreakCounter } from "./streak-counter";

interface Props {
  goals: Goal[];
  tasks: Task[];
  sessions: FocusSession[];
  weeklyFocusMinutes: number;
  weeklyGoalMinutes: number;
  avgSessionMinutes: number;
  bestStreak: number;
}

export function FocusLayout({ goals, tasks, sessions, weeklyFocusMinutes, weeklyGoalMinutes, avgSessionMinutes, bestStreak }: Props) {
  const todaySessions = sessions.filter((s) => {
    const d = new Date(s.startedAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const todayMinutes = todaySessions
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const weeklyProgressPct = Math.min(100, Math.round((weeklyFocusMinutes / weeklyGoalMinutes) * 100));

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto py-8 px-6">
      {/* Top stats row */}
      <div className="grid grid-cols-4 gap-3">
        {/* Streak */}
        <StreakCounter sessions={sessions} />

        {/* Today */}
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/35 mb-2">Today</p>
          <p className="text-2xl font-bold tabular-nums leading-none">
            {Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m
          </p>
          <p className="text-[11px] text-muted-foreground/45 mt-2">
            {todaySessions.filter((s) => s.completed).length} sessions
          </p>
        </div>

        {/* Best streak */}
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/35 mb-2">Best streak</p>
          <p className="text-2xl font-bold tabular-nums leading-none">{bestStreak}d</p>
          <p className="text-[11px] text-muted-foreground/45 mt-2">consecutive days</p>
        </div>

        {/* Avg session */}
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/35 mb-2">Avg session</p>
          <p className="text-2xl font-bold tabular-nums leading-none">{avgSessionMinutes}m</p>
          <p className="text-[11px] text-muted-foreground/45 mt-2">per session</p>
        </div>
      </div>

      {/* Weekly goal progress */}
      <div className="rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/35">Weekly goal</p>
          <p className="text-[11px] tabular-nums text-muted-foreground/60">
            {weeklyFocusMinutes}m / {weeklyGoalMinutes}m
          </p>
        </div>
        <div className="h-1.5 bg-foreground/[0.07] rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground/40 rounded-full transition-all duration-500"
            style={{ width: `${weeklyProgressPct}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground/45 mt-1.5">{weeklyProgressPct}% of 5h weekly goal</p>
      </div>

      {/* Timer */}
      <FocusTimer goals={goals} tasks={tasks} />

      {/* Session history */}
      <SessionHistory sessions={sessions} goals={goals} tasks={tasks} />
    </div>
  );
}
