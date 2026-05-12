import { db } from "@/lib/db/client";
import { corNotes as corNotesTable } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { FrameworkShell } from "@/components/frameworks/framework-shell";
import { corNotes as corMeta } from "@/lib/frameworks";
import { CorForm } from "@/components/frameworks/cor/cor-form";
import { CorList } from "@/components/frameworks/cor/cor-list";

export default async function NotesPage() {
  const notes = await db
    .select()
    .from(corNotesTable)
    .orderBy(desc(corNotesTable.createdAt));

  return (
    <FrameworkShell framework={corMeta}>
      <div className="space-y-8">
        <CorForm />
        <CorList notes={notes} />
      </div>
    </FrameworkShell>
  );
}
