"use client";

import { BoardList } from "./board-list";
import { BoardView } from "./board-view";
import type { VaultSpace, VaultBoard, VaultSection, VaultItem } from "@/lib/db/vault-schema";

interface Props {
  spaces: VaultSpace[];
  boards: VaultBoard[];
  activeBoard: VaultBoard | null;
  sections: VaultSection[];
  items: VaultItem[];
}

export function VaultLayout({ spaces, boards, activeBoard, sections, items }: Props) {
  return (
    <div
      className="flex overflow-hidden rounded-xl border border-border/60"
      style={{ minHeight: "calc(100vh - 200px)" }}
    >
      <div className="w-52 flex-shrink-0 border-r border-border/60 bg-sidebar p-3 overflow-y-auto">
        <BoardList spaces={spaces} boards={boards} />
      </div>

      <div className="flex flex-1 min-w-0 bg-background">
        {activeBoard ? (
          <BoardView board={activeBoard} sections={sections} items={items} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
            <span className="text-2xl">🗃️</span>
            <p className="text-sm">Seleccioná un board para empezar</p>
          </div>
        )}
      </div>
    </div>
  );
}
