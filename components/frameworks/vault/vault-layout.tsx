"use client";

import { useState } from "react";
import { BoardList } from "./board-list";
import { BoardView } from "./board-view";
import { BoardChat } from "./board-chat";
import { EdenSearch } from "./eden-search";
import type { VaultSpace, VaultBoard, VaultSection, VaultItem } from "@/lib/db/vault-schema";

type InternalTab = "discover" | "search" | "chat";

const TABS: { id: InternalTab; label: string }[] = [
  { id: "discover", label: "Descubrir" },
  { id: "search", label: "Buscar" },
  { id: "chat", label: "Chat" },
];

interface Props {
  spaces: VaultSpace[];
  boards: VaultBoard[];
  activeBoard: VaultBoard | null;
  sections: VaultSection[];
  items: VaultItem[];
}

export function VaultLayout({ spaces, boards, activeBoard, sections, items }: Props) {
  const [tab, setTab] = useState<InternalTab>("discover");

  return (
    <div className="flex overflow-hidden rounded-xl border border-border/60 h-full">
      {/* Left sidebar */}
      <div className="w-52 flex-shrink-0 border-r border-border/60 bg-sidebar p-3 overflow-y-auto">
        <BoardList spaces={spaces} boards={boards} />
      </div>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-background">
        {/* Internal nav tabs */}
        <div className="flex items-center gap-6 px-6 border-b border-border/40 shrink-0">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`py-3.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "discover" && (
          activeBoard ? (
            <BoardView board={activeBoard} sections={sections} items={items} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
              <span className="text-3xl">🗃️</span>
              <p className="text-sm">Seleccioná un board para explorar</p>
            </div>
          )
        )}

        {tab === "search" && <EdenSearch />}

        {tab === "chat" && (
          activeBoard ? (
            <BoardChat items={items} boardId={activeBoard.id} variant="tab" />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
              <span className="text-3xl">💬</span>
              <p className="text-sm">Seleccioná un board para chatear</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
