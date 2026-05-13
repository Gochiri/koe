import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { tasks, goals } from "@/lib/db/goals-schema";
import { eq, asc } from "drizzle-orm";
import { TasksLayout } from "@/components/frameworks/tasks/tasks-layout";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  const [allTasks, allGoals] = await Promise.all([
    db.select().from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(asc(tasks.priority), asc(tasks.createdAt)),
    db.select().from(goals).where(eq(goals.userId, userId)),
  ]);

  // Sort: high first, then in_progress, then todo, then blocked, then done
  const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const STATUS_ORDER: Record<string, number> = { in_progress: 0, todo: 1, blocked: 2, done: 3 };
  const sorted = [...allTasks].sort((a, b) => {
    const po = (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
    if (po !== 0) return po;
    return (STATUS_ORDER[a.status] ?? 1) - (STATUS_ORDER[b.status] ?? 1);
  });

  return (
    <div className="p-4 h-full">
      <TasksLayout tasks={sorted} goals={allGoals} />
    </div>
  );
}
