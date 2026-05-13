"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { vaultSpaces, vaultBoards, vaultSections, vaultItems } from "@/lib/db/vault-schema";
import { eq } from "drizzle-orm";
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
  revalidatePath("/vault");
}

export async function deleteSpace(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  // boards inside get spaceId=null via ON DELETE SET NULL
  await db.delete(vaultSpaces).where(eq(vaultSpaces.id, id));
  revalidatePath("/vault");
}

export async function moveBoardToSpace(formData: FormData) {
  await requireSession();
  const boardId = Number(formData.get("boardId"));
  const spaceIdRaw = formData.get("spaceId");
  const spaceId = spaceIdRaw ? Number(spaceIdRaw) : null;
  await db.update(vaultBoards).set({ spaceId }).where(eq(vaultBoards.id, boardId));
  revalidatePath("/vault");
}

// ── Boards ────────────────────────────────────────────────────────────────────

export async function createBoard(formData: FormData) {
  await requireSession();
  const name = z.string().min(1).max(100).parse(formData.get("name")?.toString() ?? "");
  const spaceIdRaw = formData.get("spaceId");
  const spaceId = spaceIdRaw ? Number(spaceIdRaw) : null;
  await db.insert(vaultBoards).values({ name, spaceId });
  revalidatePath("/vault");
}

export async function deleteBoard(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  await db.delete(vaultBoards).where(eq(vaultBoards.id, id));
  revalidatePath("/vault");
}

// ── Sections ──────────────────────────────────────────────────────────────────

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

// ── Vault file reader (legacy stub) ──────────────────────────────────────────

export async function fetchVaultFile(
  _relPath: string
): Promise<{ content: string; mtime: number; size: number } | null> {
  return null; // Obsidian vault integration not active
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
