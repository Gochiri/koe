"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { vaultBoards, vaultSections, vaultItems } from "@/lib/db/vault-schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireSession() {
  const s = await auth();
  if (!s?.user) throw new Error("Unauthorized");
}

// ── Boards ───────────────────────────────────────────────────────────────────

export async function createBoard(formData: FormData) {
  await requireSession();
  const name = z.string().min(1).max(100).parse(formData.get("name")?.toString() ?? "");
  await db.insert(vaultBoards).values({ name });
  revalidatePath("/vault");
}

export async function deleteBoard(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  await db.delete(vaultBoards).where(eq(vaultBoards.id, id));
  revalidatePath("/vault");
}

// ── Sections ─────────────────────────────────────────────────────────────────

export async function createSection(formData: FormData) {
  await requireSession();
  const boardId = Number(formData.get("boardId"));
  const name = z.string().min(1).max(100).parse(formData.get("name")?.toString() ?? "");
  const position = Number(formData.get("position") ?? 0);
  await db.insert(vaultSections).values({ boardId, name, position });
  revalidatePath("/vault");
}

export async function deleteSection(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  await db.delete(vaultSections).where(eq(vaultSections.id, id));
  revalidatePath("/vault");
}

// ── Items ─────────────────────────────────────────────────────────────────────

const itemSchema = z.object({
  boardId: z.coerce.number().int(),
  sectionId: z.coerce.number().int().optional(),
  kind: z.enum(["card", "doc"]).default("card"),
  title: z.string().max(300).optional().or(z.literal("")),
  body: z.string().max(50000).optional().or(z.literal("")),
});

export async function createItem(formData: FormData) {
  await requireSession();
  const parsed = itemSchema.parse({
    boardId: formData.get("boardId"),
    sectionId: formData.get("sectionId") || undefined,
    kind: formData.get("kind") ?? "card",
    title: formData.get("title") ?? "",
    body: formData.get("body") ?? "",
  });
  await db.insert(vaultItems).values({
    boardId: parsed.boardId,
    sectionId: parsed.sectionId ?? null,
    kind: parsed.kind,
    title: parsed.title || null,
    body: parsed.body || null,
  });
  revalidatePath("/vault");
}

export async function updateItem(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  const title = formData.get("title")?.toString() ?? null;
  const body = formData.get("body")?.toString() ?? null;
  await db
    .update(vaultItems)
    .set({ title: title || null, body: body || null, updatedAt: new Date() })
    .where(eq(vaultItems.id, id));
  revalidatePath("/vault");
}

export async function deleteItem(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  await db.delete(vaultItems).where(eq(vaultItems.id, id));
  revalidatePath("/vault");
}
