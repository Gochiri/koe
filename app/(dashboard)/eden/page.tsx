import { db } from "@/lib/db/client";
import { vaultSpaces, vaultBoards, vaultSections, vaultItems } from "@/lib/db/vault-schema";
import { eq, asc } from "drizzle-orm";
import { FrameworkShell } from "@/components/frameworks/framework-shell";
import { eden } from "@/lib/frameworks";
import { VaultLayout } from "@/components/frameworks/vault/vault-layout";

interface Props {
  searchParams: Promise<{ boardId?: string }>;
}

export default async function EdenPage({ searchParams }: Props) {
  const { boardId: boardIdParam } = await searchParams;
  const boardId = boardIdParam ? Number(boardIdParam) : null;

  const [spaces, boards, sections, items] = await Promise.all([
    db.select().from(vaultSpaces).orderBy(asc(vaultSpaces.position), asc(vaultSpaces.createdAt)),
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
    <FrameworkShell framework={eden}>
      <VaultLayout
        spaces={spaces}
        boards={boards}
        activeBoard={activeBoard}
        sections={sections}
        items={items}
      />
    </FrameworkShell>
  );
}
