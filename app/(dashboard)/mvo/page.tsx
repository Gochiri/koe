import { db } from "@/lib/db/client";
import { mvoPipeline } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { FrameworkShell } from "@/components/frameworks/framework-shell";
import { mvo as mvoMeta } from "@/lib/frameworks";
import { MvoForm } from "@/components/frameworks/mvo/mvo-form";
import { MvoBoard } from "@/components/frameworks/mvo/mvo-board";

export default async function MvoPage() {
  const entries = await db.select().from(mvoPipeline).orderBy(desc(mvoPipeline.updatedAt));
  return (
    <FrameworkShell framework={mvoMeta}>
      <div className="space-y-6">
        <MvoForm />
        <MvoBoard entries={entries} />
      </div>
    </FrameworkShell>
  );
}
