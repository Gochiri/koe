import { db } from "@/lib/db/client";
import { onePersonVision as onePersonTable } from "@/lib/db/schema";
import { FrameworkShell } from "@/components/frameworks/framework-shell";
import { onePerson } from "@/lib/frameworks";
import { VisionForm } from "@/components/frameworks/one-person/vision-form";

export default async function Page() {
  const rows = await db.select().from(onePersonTable).limit(1);
  const vision = rows[0] ?? null;

  return (
    <FrameworkShell framework={onePerson}>
      <VisionForm vision={vision} />
    </FrameworkShell>
  );
}
