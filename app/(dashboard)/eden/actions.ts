"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { vaultSpaces, vaultBoards, vaultSections, vaultItems } from "@/lib/db/vault-schema";
import { eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireSession() {
  const s = await auth();
  if (!s?.user) throw new Error("Unauthorized");
}

// ── Spaces ────────────────────────────────────────────────────────────────────

export async function createSpace(formData: FormData) {
  await requireSession();
  const name = z.string().min(1).max(100).parse(formData.get("name")?.toString() ?? "");
  const position = Number(formData.get("position") ?? 0);
  await db.insert(vaultSpaces).values({ name, position });
  revalidatePath("/eden");
}

export async function deleteSpace(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  // boards inside get spaceId=null via ON DELETE SET NULL
  await db.delete(vaultSpaces).where(eq(vaultSpaces.id, id));
  revalidatePath("/eden");
}

export async function moveBoardToSpace(formData: FormData) {
  await requireSession();
  const boardId = Number(formData.get("boardId"));
  const spaceIdRaw = formData.get("spaceId");
  const spaceId = spaceIdRaw ? Number(spaceIdRaw) : null;
  await db.update(vaultBoards).set({ spaceId }).where(eq(vaultBoards.id, boardId));
  revalidatePath("/eden");
}

// ── Boards ────────────────────────────────────────────────────────────────────

export async function createBoard(formData: FormData) {
  await requireSession();
  const name = z.string().min(1).max(100).parse(formData.get("name")?.toString() ?? "");
  const spaceIdRaw = formData.get("spaceId");
  const spaceId = spaceIdRaw ? Number(spaceIdRaw) : null;
  await db.insert(vaultBoards).values({ name, spaceId });
  revalidatePath("/eden");
}

export async function deleteBoard(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  await db.delete(vaultBoards).where(eq(vaultBoards.id, id));
  revalidatePath("/eden");
}

// ── Sections ──────────────────────────────────────────────────────────────────

export async function createSection(formData: FormData) {
  await requireSession();
  const boardId = Number(formData.get("boardId"));
  const name = z.string().min(1).max(100).parse(formData.get("name")?.toString() ?? "");
  const position = Number(formData.get("position") ?? 0);
  await db.insert(vaultSections).values({ boardId, name, position });
  revalidatePath("/eden");
}

export async function deleteSection(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  await db.delete(vaultSections).where(eq(vaultSections.id, id));
  revalidatePath("/eden");
}

// ── Items ─────────────────────────────────────────────────────────────────────

const itemSchema = z.object({
  boardId: z.coerce.number().int(),
  sectionId: z.coerce.number().int().optional(),
  kind: z.enum(["card", "doc", "idea", "link"]).default("card"),
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
  revalidatePath("/eden");
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
  revalidatePath("/eden");
}

export async function deleteItem(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  await db.delete(vaultItems).where(eq(vaultItems.id, id));
  revalidatePath("/eden");
}

// ── Reorder Items ─────────────────────────────────────────────────────────────

export async function reorderItems(formData: FormData) {
  await requireSession();
  const raw = formData.get("items") as string;
  const updates = JSON.parse(raw) as { id: number; position: number }[];
  if (!updates?.length) return;
  await Promise.all(
    updates.map(({ id, position }) =>
      db.update(vaultItems).set({ position }).where(eq(vaultItems.id, id))
    )
  );
  revalidatePath("/eden");
}

// ── Search ────────────────────────────────────────────────────────────────────

export async function searchItems(query: string): Promise<Array<{
  id: number;
  title: string | null;
  body: string | null;
  kind: string;
  boardId: number;
  boardName: string;
}>> {
  await requireSession();
  const q = query.trim();
  if (!q) return [];
  return db
    .select({
      id: vaultItems.id,
      title: vaultItems.title,
      body: vaultItems.body,
      kind: vaultItems.kind,
      boardId: vaultItems.boardId,
      boardName: vaultBoards.name,
    })
    .from(vaultItems)
    .innerJoin(vaultBoards, eq(vaultItems.boardId, vaultBoards.id))
    .where(
      or(
        ilike(vaultItems.title, `%${q}%`),
        ilike(vaultItems.body, `%${q}%`)
      )
    )
    .limit(20);
}

// ── Link resolver ─────────────────────────────────────────────────────────────

export async function resolveLink(url: string): Promise<{ title: string | null; isVideo: boolean }> {
  try {
    const u = new URL(url);
    const isYouTube = u.hostname.includes("youtube.com") || u.hostname === "youtu.be";
    if (isYouTube) {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const data = await res.json();
        return { title: data.title ?? null, isVideo: true };
      }
    }
  } catch {}
  return { title: null, isVideo: false };
}
