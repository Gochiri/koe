"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { corNotes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireSession() {
  const s = await auth();
  if (!s?.user) throw new Error("Unauthorized");
}

export async function createCorNote(formData: FormData) {
  await requireSession();
  const title = formData.get("title")?.toString() ?? "";
  if (!title.trim()) throw new Error("El título es requerido");
  const tagsRaw = formData.get("tags")?.toString() ?? "";
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  await db.insert(corNotes).values({
    title,
    problem: formData.get("problem")?.toString() || null,
    goal: formData.get("goal")?.toString() || null,
    example: formData.get("example")?.toString() || null,
    benefit: formData.get("benefit")?.toString() || null,
    process: formData.get("process")?.toString() || null,
    concept: formData.get("concept")?.toString() || null,
    sourceLabel: formData.get("sourceLabel")?.toString() || null,
    sourceUrl: formData.get("sourceUrl")?.toString() || null,
    tags: tags,
  });
  revalidatePath("/notes");
}

export async function deleteCorNote(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  await db.delete(corNotes).where(eq(corNotes.id, id));
  revalidatePath("/notes");
}
