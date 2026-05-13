import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { goals, tasks } from "@/lib/db/goals-schema";
import { eq, asc } from "drizzle-orm";
import { GoalsLayout } from "@/components/frameworks/goals/goals-layout";

export default async function GoalsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  const [userGoals, userTasks] = await Promise.all([
    db.select().from(goals).where(eq(goals.userId, userId)).orderBy(asc(goals.position), asc(goals.createdAt)),
    db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(asc(tasks.position), asc(tasks.createdAt)),
  ]);

  return <GoalsLayout goals={userGoals} tasks={userTasks} />;
}
