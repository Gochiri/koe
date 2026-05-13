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

  const [activeGoals, allTasks, recentSessions] = await Promise.all([
    db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.status, "active"))),
    db.select().from(tasks).where(and(eq(tasks.userId, userId))),
    db.select().from(focusSessions)
      .where(and(eq(focusSessions.userId, userId), gte(focusSessions.startedAt, weekAgo)))
      .orderBy(desc(focusSessions.startedAt)),
  ]);

  return (
    <FocusLayout
      goals={activeGoals}
      tasks={allTasks}
      sessions={recentSessions}
    />
  );
}
