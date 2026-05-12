"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { offers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const offerSchema = z.object({
  name: z.string().min(1).max(200),
  limitation: z.string().max(2000).optional().or(z.literal("")),
  goal: z.string().max(2000).optional().or(z.literal("")),
  process: z.string().max(2000).optional().or(z.literal("")),
  priceUsd: z.string().optional().or(z.literal("")),
  status: z.enum(["draft", "live", "paused", "retired"]).default("draft"),
});

function compilePitch(d: {
  limitation?: string | null;
  goal?: string | null;
  process?: string | null;
}): string {
  const parts: string[] = [];
  if (d.limitation) parts.push(`Problema: ${d.limitation.trim()}`);
  if (d.goal) parts.push(`Resultado: ${d.goal.trim()}`);
  if (d.process) parts.push(`Cómo: ${d.process.trim()}`);
  return parts.join("\n\n");
}

async function requireSession() {
  const s = await auth();
  if (!s?.user) throw new Error("Unauthorized");
}

export async function createOffer(formData: FormData) {
  await requireSession();
  const parsed = offerSchema.parse({
    name: formData.get("name")?.toString() ?? "",
    limitation: formData.get("limitation")?.toString() ?? "",
    goal: formData.get("goal")?.toString() ?? "",
    process: formData.get("process")?.toString() ?? "",
    priceUsd: formData.get("priceUsd")?.toString() ?? "",
    status: (formData.get("status")?.toString() ?? "draft") as "draft" | "live" | "paused" | "retired",
  });

  await db.insert(offers).values({
    name: parsed.name,
    limitation: parsed.limitation || null,
    goal: parsed.goal || null,
    process: parsed.process || null,
    priceUsd: parsed.priceUsd ? parsed.priceUsd : null,
    status: parsed.status,
    pitch: compilePitch(parsed),
  });

  revalidatePath("/offers");
}

export async function deleteOffer(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("Invalid id");
  await db.delete(offers).where(eq(offers.id, id));
  revalidatePath("/offers");
}

export async function setOfferStatus(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  const status = formData.get("status")?.toString() ?? "draft";
  const valid = ["draft", "live", "paused", "retired"] as const;
  if (!valid.includes(status as (typeof valid)[number])) throw new Error("Invalid status");
  await db
    .update(offers)
    .set({ status: status as (typeof valid)[number] })
    .where(eq(offers.id, id));
  revalidatePath("/offers");
}
