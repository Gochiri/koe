"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { corNotes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { readVaultFile } from "@/lib/obsidian/vault";

const corNoteSchema = z.object({
  title: z.string().min(1, "Título requerido").max(200),
  problem: z.string().max(2000).optional().nullable(),
  goal: z.string().max(2000).optional().nullable(),
  example: z.string().max(2000).optional().nullable(),
  benefit: z.string().max(2000).optional().nullable(),
  process: z.string().max(2000).optional().nullable(),
  concept: z.string().max(2000).optional().nullable(),
  sourceUrl: z.string().url().optional().or(z.literal("")).nullable(),
  sourceLabel: z.string().max(200).optional().nullable(),
  tags: z.string().max(300).optional().nullable(), // comma-separated in form
});

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function createCorNote(formData: FormData) {
  await requireSession();

  const raw = {
    title: formData.get("title")?.toString() ?? "",
    problem: formData.get("problem")?.toString() || null,
    goal: formData.get("goal")?.toString() || null,
    example: formData.get("example")?.toString() || null,
    benefit: formData.get("benefit")?.toString() || null,
    process: formData.get("process")?.toString() || null,
    concept: formData.get("concept")?.toString() || null,
    sourceUrl: formData.get("sourceUrl")?.toString() || null,
    sourceLabel: formData.get("sourceLabel")?.toString() || null,
    tags: formData.get("tags")?.toString() || null,
  };

  const parsed = corNoteSchema.parse(raw);

  const tags = parsed.tags
    ? parsed.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  await db.insert(corNotes).values({
    title: parsed.title,
    problem: parsed.problem ?? null,
    goal: parsed.goal ?? null,
    example: parsed.example ?? null,
    benefit: parsed.benefit ?? null,
    process: parsed.process ?? null,
    concept: parsed.concept ?? null,
    sourceUrl: parsed.sourceUrl || null,
    sourceLabel: parsed.sourceLabel ?? null,
    tags,
  });

  revalidatePath("/notes");
}

export async function deleteCorNote(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("Invalid id");
  await db.delete(corNotes).where(eq(corNotes.id, id));
  revalidatePath("/notes");
}

/**
 * Import a file from the Obsidian vault as a COR Note.
 * Strategy: full markdown content goes into `concept` (the catch-all field for
 * raw thinking), title from filename, tags inferred from folder path.
 * If the file was already imported (same obsidianPath), the existing note is updated.
 */
export async function importVaultFileAsCorNote(relPath: string) {
  await requireSession();
  if (!relPath.toLowerCase().endsWith(".md")) {
    throw new Error("Solo archivos .md");
  }

  const { content } = await readVaultFile(relPath);

  // Derive title from filename, tags from folder hierarchy.
  const segments = relPath.split("/");
  const filename = segments.pop() ?? relPath;
  const title = filename.replace(/\.md$/i, "");
  const tags = segments
    .map((s) => s.toLowerCase().replace(/\s+/g, "-"))
    .filter(Boolean);

  // Upsert: if a note already references this obsidianPath, update it.
  const existing = await db
    .select()
    .from(corNotes)
    .where(eq(corNotes.obsidianPath, relPath))
    .limit(1);

  if (existing[0]) {
    await db
      .update(corNotes)
      .set({
        title,
        concept: content,
        tags,
      })
      .where(eq(corNotes.id, existing[0].id));
  } else {
    await db.insert(corNotes).values({
      title,
      concept: content,
      sourceLabel: "Obsidian",
      obsidianPath: relPath,
      tags,
    });
  }

  revalidatePath("/notes");
  revalidatePath("/vault");
}
