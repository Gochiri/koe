"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { goals, tasks, milestones } from "@/lib/db/goals-schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const s = await auth();
  if (!s?.user?.id) throw new Error("Unauthorized");
  return s.user.id;
}

// ── Goals ─────────────────────────────────────────────────────────────────────

const goalSchema = z.object({
  title: z.string().min(1).max(200),
  result: z.string().max(1000).optional().or(z.literal("")),
  purpose: z.string().max(1000).optional().or(z.literal("")),
  horizon: z.enum(["90days", "1year", "3year", "lifetime"]).default("90days"),
  deadline: z.string().optional().or(z.literal("")),
  status: z.enum(["not_started", "active", "completed", "paused"]).default("active"),
  smartSpecific: z.string().max(2000).optional().or(z.literal("")),
  smartMeasurable: z.string().max(2000).optional().or(z.literal("")),
  smartAchievable: z.string().max(2000).optional().or(z.literal("")),
  smartRelevant: z.string().max(2000).optional().or(z.literal("")),
  smartTimeBound: z.string().max(2000).optional().or(z.literal("")),
});

export async function createGoal(formData: FormData) {
  const userId = await requireUser();
  const parsed = goalSchema.parse({
    title: formData.get("title"),
    result: formData.get("result") ?? "",
    purpose: formData.get("purpose") ?? "",
    horizon: formData.get("horizon") ?? "90days",
    deadline: formData.get("deadline") ?? "",
    status: "active",
    smartSpecific: formData.get("smartSpecific") ?? "",
    smartMeasurable: formData.get("smartMeasurable") ?? "",
    smartAchievable: formData.get("smartAchievable") ?? "",
    smartRelevant: formData.get("smartRelevant") ?? "",
    smartTimeBound: formData.get("smartTimeBound") ?? "",
  });
  await db.insert(goals).values({
    userId,
    title: parsed.title,
    result: parsed.result || null,
    purpose: parsed.purpose || null,
    horizon: parsed.horizon,
    deadline: parsed.deadline || null,
    smartSpecific: parsed.smartSpecific || null,
    smartMeasurable: parsed.smartMeasurable || null,
    smartAchievable: parsed.smartAchievable || null,
    smartRelevant: parsed.smartRelevant || null,
    smartTimeBound: parsed.smartTimeBound || null,
  });
  revalidatePath("/goals");
}

export async function updateGoal(formData: FormData) {
  const userId = await requireUser();
  const id = Number(formData.get("id"));
  const parsed = goalSchema.partial().parse({
    title: formData.get("title") ?? undefined,
    result: formData.get("result") ?? undefined,
    purpose: formData.get("purpose") ?? undefined,
    horizon: formData.get("horizon") ?? undefined,
    deadline: formData.get("deadline") ?? undefined,
    status: formData.get("status") ?? undefined,
    smartSpecific: formData.get("smartSpecific") ?? undefined,
    smartMeasurable: formData.get("smartMeasurable") ?? undefined,
    smartAchievable: formData.get("smartAchievable") ?? undefined,
    smartRelevant: formData.get("smartRelevant") ?? undefined,
    smartTimeBound: formData.get("smartTimeBound") ?? undefined,
  });
  await db
    .update(goals)
    .set({
      ...parsed,
      result: parsed.result || null,
      purpose: parsed.purpose || null,
      deadline: parsed.deadline || null,
      smartSpecific: parsed.smartSpecific !== undefined ? (parsed.smartSpecific || null) : undefined,
      smartMeasurable: parsed.smartMeasurable !== undefined ? (parsed.smartMeasurable || null) : undefined,
      smartAchievable: parsed.smartAchievable !== undefined ? (parsed.smartAchievable || null) : undefined,
      smartRelevant: parsed.smartRelevant !== undefined ? (parsed.smartRelevant || null) : undefined,
      smartTimeBound: parsed.smartTimeBound !== undefined ? (parsed.smartTimeBound || null) : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(goals.id, id), eq(goals.userId, userId)));
  revalidatePath("/goals");
}

export async function deleteGoal(formData: FormData) {
  const userId = await requireUser();
  const id = Number(formData.get("id"));
  await db.delete(goals).where(and(eq(goals.id, id), eq(goals.userId, userId)));
  revalidatePath("/goals");
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

const taskSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional().or(z.literal("")),
  goalId: z.coerce.number().int().optional(),
  status: z.enum(["todo", "in_progress", "done", "blocked"]).default("todo"),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  deadline: z.string().optional().or(z.literal("")),
});

export async function createTask(formData: FormData) {
  const userId = await requireUser();
  const goalIdRaw = formData.get("goalId");
  const parsed = taskSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    goalId: goalIdRaw ? Number(goalIdRaw) : undefined,
    status: "todo",
    priority: formData.get("priority") ?? "medium",
    deadline: formData.get("deadline") ?? "",
  });
  await db.insert(tasks).values({
    userId,
    goalId: parsed.goalId ?? null,
    title: parsed.title,
    description: parsed.description || null,
    priority: parsed.priority,
    deadline: parsed.deadline || null,
  });
  revalidatePath("/goals");
  revalidatePath("/tasks");
}

export async function updateTask(formData: FormData) {
  const userId = await requireUser();
  const id = Number(formData.get("id"));

  const statusRaw = formData.get("status")?.toString();
  const priorityRaw = formData.get("priority")?.toString();
  const titleRaw = formData.get("title")?.toString();
  const descriptionRaw = formData.get("description")?.toString() ?? undefined;
  const deadlineRaw = formData.get("deadline")?.toString() ?? undefined;

  await db
    .update(tasks)
    .set({
      ...(statusRaw && { status: statusRaw }),
      ...(priorityRaw && { priority: priorityRaw }),
      ...(titleRaw && { title: titleRaw }),
      ...(descriptionRaw !== undefined && { description: descriptionRaw || null }),
      ...(deadlineRaw !== undefined && { deadline: deadlineRaw || null }),
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  revalidatePath("/goals");
  revalidatePath("/tasks");
}

export async function deleteTask(formData: FormData) {
  const userId = await requireUser();
  const id = Number(formData.get("id"));
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  revalidatePath("/goals");
  revalidatePath("/tasks");
}

// ── Milestones ─────────────────────────────────────────────────────────────────

export async function createMilestone(formData: FormData) {
  const userId = await requireUser();
  const goalId = Number(formData.get("goalId"));
  const title = z.string().min(1).max(300).parse(formData.get("title")?.toString() ?? "");
  const position = Number(formData.get("position") ?? 0);
  await db.insert(milestones).values({ userId, goalId, title, position });
  revalidatePath("/goals");
}

export async function updateMilestone(formData: FormData) {
  const userId = await requireUser();
  const id = Number(formData.get("id"));
  const completedRaw = formData.get("completed");
  const titleRaw = formData.get("title")?.toString();
  await db
    .update(milestones)
    .set({
      ...(completedRaw !== null && { completed: completedRaw === "true" }),
      ...(titleRaw && { title: titleRaw }),
    })
    .where(and(eq(milestones.id, id), eq(milestones.userId, userId)));
  revalidatePath("/goals");
}

export async function deleteMilestone(formData: FormData) {
  const userId = await requireUser();
  const id = Number(formData.get("id"));
  await db.delete(milestones).where(and(eq(milestones.id, id), eq(milestones.userId, userId)));
  revalidatePath("/goals");
}
