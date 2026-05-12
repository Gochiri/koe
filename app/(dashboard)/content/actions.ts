"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { contentPieces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const TYPES = ["newsletter", "x_thread", "x_short", "yt_script", "yt_short", "li_post"] as const;
const STATUSES = ["idea", "draft", "scheduled", "published"] as const;

const schema = z.object({
  type: z.enum(TYPES).default("newsletter"),
  title: z.string().min(1).max(300),
  body: z.string().max(20000).optional().or(z.literal("")),
  publishedUrl: z.string().url().optional().or(z.literal("")),
  parentId: z.coerce.number().int().optional(),
});

async function requireSession() {
  const s = await auth();
  if (!s?.user) throw new Error("Unauthorized");
}

export async function createContentPiece(formData: FormData) {
  await requireSession();
  const parentIdRaw = formData.get("parentId")?.toString();
  const parsed = schema.parse({
    type: (formData.get("type")?.toString() ?? "newsletter") as (typeof TYPES)[number],
    title: formData.get("title")?.toString() ?? "",
    body: formData.get("body")?.toString() ?? "",
    publishedUrl: formData.get("publishedUrl")?.toString() ?? "",
    parentId: parentIdRaw ? parentIdRaw : undefined,
  });
  await db.insert(contentPieces).values({
    type: parsed.type,
    title: parsed.title,
    body: parsed.body || null,
    publishedUrl: parsed.publishedUrl || null,
    parentId: parsed.parentId ?? null,
  });
  revalidatePath("/content");
}

export async function setContentStatus(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  const status = formData.get("status")?.toString() ?? "";
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) throw new Error("Invalid status");
  await db
    .update(contentPieces)
    .set({ status: status as (typeof STATUSES)[number], updatedAt: new Date() })
    .where(eq(contentPieces.id, id));
  revalidatePath("/content");
}

export async function deleteContentPiece(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  await db.delete(contentPieces).where(eq(contentPieces.id, id));
  revalidatePath("/content");
}
