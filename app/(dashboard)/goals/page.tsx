import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { goals, tasks, milestones } from "@/lib/db/goals-schema";
import { eq, asc } from "drizzle-orm";
import { GoalsLayout } from "@/components/frameworks/goals/goals-layout";

export default async function GoalsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  const [userGoals, userTasks, userMilestones] = await Promise.all([
    db.select().from(goals).where(eq(goals.userId, userId)).orderBy(asc(goals.position), asc(goals.createdAt)),
    db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(asc(tasks.position), asc(tasks.createdAt)),
    db.select().from(milestones).where(eq(milestones.userId, userId)).orderBy(asc(milestones.position), asc(milestones.createdAt)),
  ]);

  return (
    <div className="p-4 h-full">
      <GoalsLayout goals={userGoals} tasks={userTasks} milestones={userMilestones} />
    </div>
  );
}
