import { db } from "@/lib/db/client";
import { vaultBoards, vaultSections, vaultItems } from "@/lib/db/vault-schema";
import { eq, asc } from "drizzle-orm";
import { FrameworkShell } from "@/components/frameworks/framework-shell";
import { vault } from "@/lib/frameworks";
import { VaultLayout } from "@/components/frameworks/vault/vault-layout";

interface Props {
  searchParams: Promise<{ boardId?: string }>;
}

export default async function VaultPage({ searchParams }: Props) {
  const { boardId: boardIdParam } = await searchParams;
  const boardId = boardIdParam ? Number(boardIdParam) : null;

  const [boards, sections, items] = await Promise.all([
    db.select().from(vaultBoards).orderBy(asc(vaultBoards.createdAt)),
    boardId
      ? db.select().from(vaultSections).where(eq(vaultSections.boardId, boardId)).orderBy(asc(vaultSections.position))
      : Promise.resolve([]),
    boardId
      ? db.select().from(vaultItems).where(eq(vaultItems.boardId, boardId)).orderBy(asc(vaultItems.position), asc(vaultItems.createdAt))
      : Promise.resolve([]),
  ]);

  const activeBoard = boards.find((b) => b.id === boardId) ?? null;

  return (
    <FrameworkShell framework={vault}>
      <VaultLayout
        boards={boards}
        activeBoard={activeBoard}
        sections={sections}
        items={items}
      />
    </FrameworkShell>
  );
}
