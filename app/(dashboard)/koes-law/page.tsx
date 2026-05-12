import { db } from "@/lib/db/client";
import { timeLog } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { FrameworkShell } from "@/components/frameworks/framework-shell";
import { koesLaw } from "@/lib/frameworks";
import { KoesForm } from "@/components/frameworks/koes-law/koes-form";
import { KoesChart } from "@/components/frameworks/koes-law/koes-chart";

export default async function KoesLawPage() {
  const logs = await db.select().from(timeLog).orderBy(desc(timeLog.date)).limit(90);
  return (
    <FrameworkShell framework={koesLaw}>
      <div className="space-y-6">
        <KoesForm />
        <KoesChart logs={logs} />
      </div>
    </FrameworkShell>
  );
}
