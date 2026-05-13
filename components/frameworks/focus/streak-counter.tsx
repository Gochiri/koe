"use client";

import type { FocusSession } from "@/lib/db/goals-schema";

interface Props {
  sessions: FocusSession[];
}

function computeStreak(sessions: FocusSession[]): number {
  const completed = sessions.filter((s) => s.completed);
  if (completed.length === 0) return 0;

  // Get unique days with completed sessions (as YYYY-MM-DD)
  const days = new Set(
    completed.map((s) => new Date(s.startedAt).toDateString())
  );

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (days.has(d.toDateString())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}

export function StreakCounter({ sessions }: Props) {
  const streak = computeStreak(sessions);

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 flex flex-col items-center justify-center min-w-[100px]">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">Streak</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{streak}</span>
        <span className="text-sm text-muted-foreground">days</span>
      </div>
      {streak > 0 && <span className="text-lg mt-0.5">🔥</span>}
    </div>
  );
}
