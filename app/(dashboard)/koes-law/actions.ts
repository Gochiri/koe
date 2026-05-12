"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { timeLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hoursWorked: z.coerce.number().min(0).max(24),
  revenueUsd: z.coerce.number().min(0).default(0),
  notes: z.string().max(500).optional().or(z.literal("")),
});

async function requireSession() {
  const s = await auth();
  if (!s?.user) throw new Error("Unauthorized");
}

export async function upsertTimeLog(formData: FormData) {
  await requireSession();
  const parsed = schema.parse({
    date: formData.get("date")?.toString() ?? "",
    hoursWorked: formData.get("hoursWorked")?.toString() ?? "0",
    revenueUsd: formData.get("revenueUsd")?.toString() ?? "0",
    notes: formData.get("notes")?.toString() ?? "",
  });

  await db
    .insert(timeLog)
    .values({
      date: parsed.date,
      hoursWorked: String(parsed.hoursWorked),
      revenueUsd: String(parsed.revenueUsd),
      notes: parsed.notes || null,
    })
    .onConflictDoUpdate({
      target: timeLog.date,
      set: {
        hoursWorked: String(parsed.hoursWorked),
        revenueUsd: String(parsed.revenueUsd),
        notes: parsed.notes || null,
      },
    });
  revalidatePath("/koes-law");
}

export async function deleteTimeLog(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  await db.delete(timeLog).where(eq(timeLog.id, id));
  revalidatePath("/koes-law");
}
