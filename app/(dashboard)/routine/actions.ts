"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { routineLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const routineSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  energyBlockStart: z
    .string()
    .regex(timeRegex, "Hora inválida (HH:MM)")
    .optional()
    .or(z.literal("")),
  energyBlockEnd: z
    .string()
    .regex(timeRegex, "Hora inválida (HH:MM)")
    .optional()
    .or(z.literal("")),
  walkMinutes: z.coerce.number().int().min(0).max(600).default(0),
  totalWorkedMinutes: z.coerce.number().int().min(0).max(1440).default(0),
  deepWorkTask: z.string().max(500).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function upsertRoutineLog(formData: FormData) {
  await requireSession();

  const raw = {
    date: formData.get("date")?.toString() ?? "",
    energyBlockStart: formData.get("energyBlockStart")?.toString() ?? "",
    energyBlockEnd: formData.get("energyBlockEnd")?.toString() ?? "",
    walkMinutes: formData.get("walkMinutes")?.toString() ?? "0",
    totalWorkedMinutes: formData.get("totalWorkedMinutes")?.toString() ?? "0",
    deepWorkTask: formData.get("deepWorkTask")?.toString() ?? "",
    notes: formData.get("notes")?.toString() ?? "",
  };

  const parsed = routineSchema.parse(raw);

  await db
    .insert(routineLog)
    .values({
      date: parsed.date,
      energyBlockStart: parsed.energyBlockStart || null,
      energyBlockEnd: parsed.energyBlockEnd || null,
      walkMinutes: parsed.walkMinutes,
      totalWorkedMinutes: parsed.totalWorkedMinutes,
      deepWorkTask: parsed.deepWorkTask || null,
      notes: parsed.notes || null,
    })
    .onConflictDoUpdate({
      target: routineLog.date,
      set: {
        energyBlockStart: parsed.energyBlockStart || null,
        energyBlockEnd: parsed.energyBlockEnd || null,
        walkMinutes: parsed.walkMinutes,
        totalWorkedMinutes: parsed.totalWorkedMinutes,
        deepWorkTask: parsed.deepWorkTask || null,
        notes: parsed.notes || null,
      },
    });

  revalidatePath("/routine");
}

export async function deleteRoutineLog(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("Invalid id");
  await db.delete(routineLog).where(eq(routineLog.id, id));
  revalidatePath("/routine");
}
