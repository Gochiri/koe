"use client";

import type { FocusSession } from "@/lib/db/goals-schema";

interface Props {
  sessions: FocusSession[];
}

function computeStreak(sessions: FocusSession[]): number {
  const completed = sessions.filter((s) => s.completed);
  if (completed.length === 0) return 0;

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
    <div className="rounded-xl border border-border bg-card px-4 py-3 flex flex-col items-center justify-center min-w-[88px]">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/35 mb-1.5">
        Racha
      </p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums leading-none">{streak}</span>
        <span className="text-[11px] text-muted-foreground/45 font-medium">d</span>
      </div>
    </div>
  );
}
