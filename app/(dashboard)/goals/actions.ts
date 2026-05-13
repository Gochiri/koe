"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { goals, tasks } from "@/lib/db/goals-schema";
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
  status: z.enum(["active", "completed", "paused"]).default("active"),
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
  });
  await db.insert(goals).values({
    userId,
    title: parsed.title,
    result: parsed.result || null,
    purpose: parsed.purpose || null,
    horizon: parsed.horizon,
    deadline: parsed.deadline || null,
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
  });
  await db
    .update(goals)
    .set({
      ...parsed,
      result: parsed.result || null,
      purpose: parsed.purpose || null,
      deadline: parsed.deadline || null,
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
}

export async function deleteTask(formData: FormData) {
  const userId = await requireUser();
  const id = Number(formData.get("id"));
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  revalidatePath("/goals");
}
