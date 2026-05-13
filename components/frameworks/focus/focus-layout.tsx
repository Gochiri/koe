"use client";

import type { Goal, Task, FocusSession } from "@/lib/db/goals-schema";
import { FocusTimer } from "./focus-timer";
import { SessionHistory } from "./session-history";
import { StreakCounter } from "./streak-counter";

interface Props {
  goals: Goal[];
  tasks: Task[];
  sessions: FocusSession[];
}

export function FocusLayout({ goals, tasks, sessions }: Props) {
  const todaySessions = sessions.filter((s) => {
    const d = new Date(s.startedAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const todayMinutes = todaySessions
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto py-8 px-6">
      {/* Top row: streak + today stats */}
      <div className="flex gap-3">
        <StreakCounter sessions={sessions} />

        <div className="flex-1 rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/35 mb-2">Today</p>
          <p className="text-2xl font-bold tabular-nums leading-none">
            {Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m
          </p>
          <p className="text-[11px] text-muted-foreground/45 mt-2">
            {todaySessions.filter((s) => s.completed).length} sessions complete
          </p>
        </div>
      </div>

      {/* Timer */}
      <FocusTimer goals={goals} tasks={tasks} />

      {/* Session history */}
      <SessionHistory sessions={sessions} goals={goals} tasks={tasks} />
    </div>
  );
}
