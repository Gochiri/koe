"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { onePersonVision as onePersonTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const visionSchema = z.object({
  identity: z.string().max(500).optional().or(z.literal("")),
  problemISolve: z.string().max(2000).optional().or(z.literal("")),
  idealCustomer: z.string().max(2000).optional().or(z.literal("")),
  productizedSelf: z.string().max(2000).optional().or(z.literal("")),
});

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

export async function upsertVision(formData: FormData) {
  await requireSession();

  const raw = {
    identity: formData.get("identity")?.toString() ?? "",
    problemISolve: formData.get("problemISolve")?.toString() ?? "",
    idealCustomer: formData.get("idealCustomer")?.toString() ?? "",
    productizedSelf: formData.get("productizedSelf")?.toString() ?? "",
  };

  const parsed = visionSchema.parse(raw);

  const existing = await db.select().from(onePersonTable).limit(1);

  if (existing.length === 0) {
    await db.insert(onePersonTable).values({
      identity: parsed.identity || null,
      problemISolve: parsed.problemISolve || null,
      idealCustomer: parsed.idealCustomer || null,
      productizedSelf: parsed.productizedSelf || null,
    });
  } else {
    await db
      .update(onePersonTable)
      .set({
        identity: parsed.identity || null,
        problemISolve: parsed.problemISolve || null,
        idealCustomer: parsed.idealCustomer || null,
        productizedSelf: parsed.productizedSelf || null,
        updatedAt: new Date(),
      })
      .where(eq(onePersonTable.id, existing[0].id));
  }

  revalidatePath("/one-person");
}
