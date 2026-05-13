"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { focusSessions } from "@/lib/db/goals-schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const s = await auth();
  if (!s?.user?.id) throw new Error("Unauthorized");
  return s.user.id;
}

export async function startSession(formData: FormData) {
  const userId = await requireUser();
  const goalId = formData.get("goalId") ? Number(formData.get("goalId")) : null;
  const taskId = formData.get("taskId") ? Number(formData.get("taskId")) : null;

  const [session] = await db
    .insert(focusSessions)
    .values({
      userId,
      goalId,
      taskId,
      durationMinutes: 0,
      startedAt: new Date(),
    })
    .returning({ id: focusSessions.id });

  revalidatePath("/focus");
  return session.id;
}

export async function endSession(formData: FormData) {
  const userId = await requireUser();
  const id = Number(formData.get("id"));
  const durationMinutes = Number(formData.get("durationMinutes"));
  const completed = formData.get("completed") === "true";
  const notes = formData.get("notes")?.toString() ?? null;

  await db
    .update(focusSessions)
    .set({
      durationMinutes,
      completed,
      notes,
      endedAt: new Date(),
    })
    .where(and(eq(focusSessions.id, id), eq(focusSessions.userId, userId)));

  revalidatePath("/focus");
}

export async function deleteSession(formData: FormData) {
  const userId = await requireUser();
  const id = Number(formData.get("id"));
  await db
    .delete(focusSessions)
    .where(and(eq(focusSessions.id, id), eq(focusSessions.userId, userId)));
  revalidatePath("/focus");
}

export async function getSessionsThisWeek(userId: string) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return db
    .select()
    .from(focusSessions)
    .where(and(eq(focusSessions.userId, userId), gte(focusSessions.startedAt, weekAgo)))
    .orderBy(desc(focusSessions.startedAt));
}
