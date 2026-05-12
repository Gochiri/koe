import { db } from "@/lib/db/client";
import { skills as skillsTable } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { FrameworkShell } from "@/components/frameworks/framework-shell";
import { buildTeachEarn } from "@/lib/frameworks";
import { SkillForm } from "@/components/frameworks/skills/skill-form";
import { SkillList } from "@/components/frameworks/skills/skill-list";

export default async function SkillsPage() {
  const skills = await db.select().from(skillsTable).orderBy(desc(skillsTable.createdAt));
  return (
    <FrameworkShell framework={buildTeachEarn}>
      <div className="space-y-6">
        <SkillForm />
        <SkillList skills={skills} />
      </div>
    </FrameworkShell>
  );
}
