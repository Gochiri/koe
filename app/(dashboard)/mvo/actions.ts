"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { mvoPipeline } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const STAGES = ["prospect", "call_scheduled", "sold", "delivering", "done", "lost"] as const;

const schema = z.object({
  prospectName: z.string().min(1).max(200),
  prospectContact: z.string().max(200).optional().or(z.literal("")),
  priceUsd: z.string().optional().or(z.literal("")),
  callsTotal: z.coerce.number().int().min(1).max(50).default(4),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

async function requireSession() {
  const s = await auth();
  if (!s?.user) throw new Error("Unauthorized");
}

export async function createMvoEntry(formData: FormData) {
  await requireSession();
  const parsed = schema.parse({
    prospectName: formData.get("prospectName")?.toString() ?? "",
    prospectContact: formData.get("prospectContact")?.toString() ?? "",
    priceUsd: formData.get("priceUsd")?.toString() ?? "",
    callsTotal: formData.get("callsTotal")?.toString() ?? "4",
    notes: formData.get("notes")?.toString() ?? "",
  });

  await db.insert(mvoPipeline).values({
    prospectName: parsed.prospectName,
    prospectContact: parsed.prospectContact || null,
    priceUsd: parsed.priceUsd || null,
    callsTotal: parsed.callsTotal,
    notes: parsed.notes || null,
  });
  revalidatePath("/mvo");
}

export async function moveMvoStage(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  const stage = formData.get("stage")?.toString() ?? "";
  if (!STAGES.includes(stage as (typeof STAGES)[number])) throw new Error("Invalid stage");
  await db
    .update(mvoPipeline)
    .set({
      stage: stage as (typeof STAGES)[number],
      updatedAt: new Date(),
    })
    .where(eq(mvoPipeline.id, id));
  revalidatePath("/mvo");
}

export async function incMvoCalls(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  const delta = Number(formData.get("delta") ?? "1");
  const [row] = await db.select().from(mvoPipeline).where(eq(mvoPipeline.id, id)).limit(1);
  if (!row) throw new Error("Not found");
  const next = Math.max(0, Math.min(row.callsTotal, row.callsDone + delta));
  await db
    .update(mvoPipeline)
    .set({ callsDone: next, updatedAt: new Date() })
    .where(eq(mvoPipeline.id, id));
  revalidatePath("/mvo");
}

export async function deleteMvoEntry(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  await db.delete(mvoPipeline).where(eq(mvoPipeline.id, id));
  revalidatePath("/mvo");
}
