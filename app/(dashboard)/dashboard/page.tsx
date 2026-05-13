import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { goals, tasks, focusSessions } from "@/lib/db/goals-schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { DashboardLayout } from "@/components/frameworks/dashboard/dashboard-layout";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [allGoals, allTasks, recentSessions, prevWeekSessions] = await Promise.all([
    db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt)),
    db.select().from(tasks).where(eq(tasks.userId, userId)),
    db.select().from(focusSessions)
      .where(and(eq(focusSessions.userId, userId), gte(focusSessions.startedAt, weekAgo)))
      .orderBy(desc(focusSessions.startedAt)),
    db.select().from(focusSessions)
      .where(and(eq(focusSessions.userId, userId), gte(focusSessions.startedAt, twoWeeksAgo)))
      .orderBy(desc(focusSessions.startedAt)),
  ]);

  // ── Core metrics ──────────────────────────────────────────────────────────
  const activeGoals = allGoals.filter((g) => g.status === "active");
  const completedGoalsThisMonth = allGoals.filter(
    (g) => g.status === "completed" && new Date(g.updatedAt) >= monthAgo
  );

  const today = new Date().toDateString();
  const tasksCompletedToday = allTasks.filter(
    (t) => t.status === "done" && new Date(t.updatedAt).toDateString() === today
  );
  const tasksCompletedThisWeek = allTasks.filter(
    (t) => t.status === "done" && new Date(t.updatedAt) >= weekAgo
  );

  const weeklyFocusMinutes = recentSessions
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  // ── Productivity scores ───────────────────────────────────────────────────
  const productivityScore = Math.min(100, Math.round(
    (weeklyFocusMinutes / 120) * 50 +
    (tasksCompletedThisWeek.length * 10)
  ));

  const prevWeekOnly = prevWeekSessions.filter(
    (s) => s.completed && new Date(s.startedAt) < weekAgo
  );
  const prevFocusMinutes = prevWeekOnly.reduce((sum, s) => sum + s.durationMinutes, 0);
  const prevTasksDone = allTasks.filter(
    (t) => t.status === "done" &&
    new Date(t.updatedAt) >= twoWeeksAgo &&
    new Date(t.updatedAt) < weekAgo
  ).length;
  const previousScore = Math.min(100, Math.round(
    (prevFocusMinutes / 120) * 50 +
    (prevTasksDone * 10)
  ));

  // High-impact tasks (priority=high)
  const highImpactTotal = allTasks.filter((t) => t.priority === "high").length;
  const highImpactCompleted = allTasks.filter((t) => t.priority === "high" && t.status === "done").length;

  // Streak
  const completedSessionDates = new Set(
    recentSessions.filter((s) => s.completed).map((s) => new Date(s.startedAt).toDateString())
  );
  let streak = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (completedSessionDates.has(d.toDateString())) streak++;
    else if (i > 0) break;
  }

  // Focus per day
  const focusByDay: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    focusByDay[d.toDateString()] = 0;
  }
  recentSessions.filter((s) => s.completed).forEach((s) => {
    const key = new Date(s.startedAt).toDateString();
    if (key in focusByDay) focusByDay[key] += s.durationMinutes;
  });

  return (
    <DashboardLayout
      activeGoals={activeGoals}
      allTasks={allTasks}
      completedGoalsThisMonth={completedGoalsThisMonth.length}
      tasksCompletedToday={tasksCompletedToday.length}
      tasksCompletedThisWeek={tasksCompletedThisWeek.length}
      weeklyFocusMinutes={weeklyFocusMinutes}
      focusByDay={focusByDay}
      recentSessions={recentSessions}
      productivityScore={productivityScore}
      previousScore={previousScore}
      highImpactTotal={highImpactTotal}
      highImpactCompleted={highImpactCompleted}
      streak={streak}
      completedGoals={allGoals.filter((g) => g.status === "completed").length}
    />
  );
}
