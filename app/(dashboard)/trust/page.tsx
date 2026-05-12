import { db } from "@/lib/db/client";
import { trustEntries } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { FrameworkShell } from "@/components/frameworks/framework-shell";
import { trustMatrix } from "@/lib/frameworks";
import { TrustForm } from "@/components/frameworks/trust/trust-form";
import { TrustBalance } from "@/components/frameworks/trust/trust-balance";

export default async function TrustPage() {
  const entries = await db.select().from(trustEntries).orderBy(desc(trustEntries.date)).limit(200);
  return (
    <FrameworkShell framework={trustMatrix}>
      <div className="space-y-6">
        <TrustForm />
        <TrustBalance entries={entries} />
      </div>
    </FrameworkShell>
  );
}
