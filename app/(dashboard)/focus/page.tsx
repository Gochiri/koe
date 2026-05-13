import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { goals, tasks, focusSessions } from "@/lib/db/goals-schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { FocusLayout } from "@/components/frameworks/focus/focus-layout";

export default async function FocusPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [activeGoals, allTasks, recentSessions, allSessions] = await Promise.all([
    db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.status, "active"))),
    db.select().from(tasks).where(and(eq(tasks.userId, userId))),
    db.select().from(focusSessions)
      .where(and(eq(focusSessions.userId, userId), gte(focusSessions.startedAt, weekAgo)))
      .orderBy(desc(focusSessions.startedAt)),
    db.select().from(focusSessions)
      .where(and(eq(focusSessions.userId, userId)))
      .orderBy(desc(focusSessions.startedAt)),
  ]);

  // ── Stats ──────────────────────────────────────────────────────────────────

  // Weekly focus minutes (only completed)
  const weeklyFocusMinutes = recentSessions
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  // Avg session length (all completed sessions, last 30)
  const completedAll = allSessions.filter((s) => s.completed);
  const avgSessionMinutes = completedAll.length > 0
    ? Math.round(completedAll.slice(0, 30).reduce((sum, s) => sum + s.durationMinutes, 0) / Math.min(completedAll.length, 30))
    : 0;

  // Best streak — count consecutive days with at least one completed session
  const completedDates = new Set(
    completedAll.map((s) => new Date(s.startedAt).toDateString())
  );
  let bestStreak = 0;
  let currentStreak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (completedDates.has(d.toDateString())) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else if (i > 0) {
      break; // streaks must be consecutive from today backwards
    }
  }

  // Weekly goal: 300 minutes (5 hours)
  const weeklyGoalMinutes = 300;

  return (
    <FocusLayout
      goals={activeGoals}
      tasks={allTasks}
      sessions={recentSessions}
      weeklyFocusMinutes={weeklyFocusMinutes}
      weeklyGoalMinutes={weeklyGoalMinutes}
      avgSessionMinutes={avgSessionMinutes}
      bestStreak={bestStreak}
    />
  );
}
