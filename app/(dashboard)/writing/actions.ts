"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { apagDrafts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const apagSchema = z.object({
  title: z.string().min(1, "Título requerido").max(200),
  attention: z.string().max(3000).optional().or(z.literal("")),
  perspective: z.string().max(3000).optional().or(z.literal("")),
  advantage: z.string().max(3000).optional().or(z.literal("")),
  gamification: z.string().max(3000).optional().or(z.literal("")),
});

function compileFinalOutput(d: {
  attention?: string | null;
  perspective?: string | null;
  advantage?: string | null;
  gamification?: string | null;
}) {
  const parts = [
    d.attention?.trim(),
    d.perspective?.trim(),
    d.advantage?.trim(),
    d.gamification?.trim(),
  ].filter(Boolean);
  return parts.join("\n\n");
}

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function createApagDraft(formData: FormData) {
  await requireSession();

  const raw = {
    title: formData.get("title")?.toString() ?? "",
    attention: formData.get("attention")?.toString() ?? "",
    perspective: formData.get("perspective")?.toString() ?? "",
    advantage: formData.get("advantage")?.toString() ?? "",
    gamification: formData.get("gamification")?.toString() ?? "",
  };

  const parsed = apagSchema.parse(raw);
  const finalOutput = compileFinalOutput(parsed);

  await db.insert(apagDrafts).values({
    title: parsed.title,
    attention: parsed.attention || null,
    perspective: parsed.perspective || null,
    advantage: parsed.advantage || null,
    gamification: parsed.gamification || null,
    finalOutput,
  });

  revalidatePath("/writing");
}

export async function markApagPublished(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("Invalid id");
  await db.update(apagDrafts).set({ publishedAt: new Date() }).where(eq(apagDrafts.id, id));
  revalidatePath("/writing");
}

export async function deleteApagDraft(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("Invalid id");
  await db.delete(apagDrafts).where(eq(apagDrafts.id, id));
  revalidatePath("/writing");
}
