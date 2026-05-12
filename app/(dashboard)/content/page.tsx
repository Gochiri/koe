import { db } from "@/lib/db/client";
import { contentPieces } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { FrameworkShell } from "@/components/frameworks/framework-shell";
import { contentEcosystem } from "@/lib/frameworks";
import { ContentForm } from "@/components/frameworks/content/content-form";
import { ContentKanban } from "@/components/frameworks/content/content-kanban";

export default async function ContentPage() {
  const [pieces, newsletters] = await Promise.all([
    db.select().from(contentPieces).orderBy(desc(contentPieces.updatedAt)).limit(200),
    db
      .select()
      .from(contentPieces)
      .where(eq(contentPieces.type, "newsletter"))
      .orderBy(desc(contentPieces.createdAt))
      .limit(50),
  ]);

  return (
    <FrameworkShell framework={contentEcosystem}>
      <div className="space-y-6">
        <ContentForm newsletters={newsletters} />
        <ContentKanban pieces={pieces} />
      </div>
    </FrameworkShell>
  );
}
