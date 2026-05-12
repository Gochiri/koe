import { db } from "@/lib/db/client";
import { routineLog } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { FrameworkShell } from "@/components/frameworks/framework-shell";
import { routine } from "@/lib/frameworks";
import { RoutineForm } from "@/components/frameworks/routine/routine-form";
import { RoutineList } from "@/components/frameworks/routine/routine-list";

export default async function RoutinePage() {
  const logs = await db.select().from(routineLog).orderBy(desc(routineLog.date)).limit(60);

  return (
    <FrameworkShell framework={routine}>
      <div className="space-y-6">
        <RoutineForm />
        <RoutineList logs={logs} />
      </div>
    </FrameworkShell>
  );
}
