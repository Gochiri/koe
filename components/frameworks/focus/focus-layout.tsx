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
    <div className="flex flex-col gap-6 max-w-3xl mx-auto py-6 px-4">
      {/* Top row: streak + today stats */}
      <div className="flex gap-4">
        <StreakCounter sessions={sessions} />

        <div className="flex-1 rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">Hoy</p>
          <p className="text-2xl font-bold">{Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m</p>
          <p className="text-xs text-muted-foreground">{todaySessions.filter((s) => s.completed).length} sesiones completadas</p>
        </div>
      </div>

      {/* Timer */}
      <FocusTimer goals={goals} tasks={tasks} />

      {/* Session history */}
      <SessionHistory sessions={sessions} goals={goals} tasks={tasks} />
    </div>
  );
}
