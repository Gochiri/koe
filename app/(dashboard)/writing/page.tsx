import { db } from "@/lib/db/client";
import { apagDrafts } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { FrameworkShell } from "@/components/frameworks/framework-shell";
import { apag } from "@/lib/frameworks";
import { ApagForm } from "@/components/frameworks/apag/apag-form";
import { ApagList } from "@/components/frameworks/apag/apag-list";

export default async function WritingPage() {
  const drafts = await db.select().from(apagDrafts).orderBy(desc(apagDrafts.createdAt));

  return (
    <FrameworkShell framework={apag}>
      <div className="space-y-6">
        <ApagForm />
        <ApagList drafts={drafts} />
      </div>
    </FrameworkShell>
  );
}
