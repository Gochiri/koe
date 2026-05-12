"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { trustEntries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bucket: z.enum(["growth", "authority", "authenticity"]),
  title: z.string().min(1).max(300),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

async function requireSession() {
  const s = await auth();
  if (!s?.user) throw new Error("Unauthorized");
}

export async function createTrustEntry(formData: FormData) {
  await requireSession();
  const parsed = schema.parse({
    date: formData.get("date")?.toString() ?? "",
    bucket: formData.get("bucket")?.toString() ?? "",
    title: formData.get("title")?.toString() ?? "",
    notes: formData.get("notes")?.toString() ?? "",
  });
  await db.insert(trustEntries).values({
    date: parsed.date,
    bucket: parsed.bucket,
    title: parsed.title,
    notes: parsed.notes || null,
  });
  revalidatePath("/trust");
}

export async function deleteTrustEntry(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("Invalid id");
  await db.delete(trustEntries).where(eq(trustEntries.id, id));
  revalidatePath("/trust");
}
