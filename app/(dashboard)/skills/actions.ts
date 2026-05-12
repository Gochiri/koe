"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { skills } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const schema = z.object({
  name: z.string().min(1).max(200),
  phase: z.enum(["build", "teach", "earn"]).default("build"),
  project: z.string().max(500).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  revenueUsd: z.string().optional().or(z.literal("")),
  startedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
    .optional()
    .or(z.literal("")),
});

async function requireSession() {
  const s = await auth();
  if (!s?.user) throw new Error("Unauthorized");
}

export async function createSkill(formData: FormData) {
  await requireSession();
  const parsed = schema.parse({
    name: formData.get("name")?.toString() ?? "",
    phase: (formData.get("phase")?.toString() ?? "build") as "build" | "teach" | "earn",
    project: formData.get("project")?.toString() ?? "",
    notes: formData.get("notes")?.toString() ?? "",
    revenueUsd: formData.get("revenueUsd")?.toString() ?? "",
    startedAt: formData.get("startedAt")?.toString() ?? "",
  });

  await db.insert(skills).values({
    name: parsed.name,
    phase: parsed.phase,
    project: parsed.project || null,
    notes: parsed.notes || null,
    revenueUsd: parsed.revenueUsd || "0",
    startedAt: parsed.startedAt || null,
  });
  revalidatePath("/skills");
}

export async function setSkillPhase(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  const phase = formData.get("phase")?.toString() ?? "";
  if (!["build", "teach", "earn"].includes(phase)) throw new Error("Invalid phase");
  await db
    .update(skills)
    .set({ phase: phase as "build" | "teach" | "earn" })
    .where(eq(skills.id, id));
  revalidatePath("/skills");
}

export async function updateSkillRevenue(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  const revenueUsd = formData.get("revenueUsd")?.toString() ?? "0";
  await db.update(skills).set({ revenueUsd }).where(eq(skills.id, id));
  revalidatePath("/skills");
}

export async function deleteSkill(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  await db.delete(skills).where(eq(skills.id, id));
  revalidatePath("/skills");
}
