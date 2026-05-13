"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBoard, deleteBoard, createSpace, deleteSpace } from "@/app/(dashboard)/eden/actions";
import { toast } from "sonner";
import type { VaultSpace, VaultBoard } from "@/lib/db/vault-schema";

interface Props {
  spaces: VaultSpace[];
  boards: VaultBoard[];
}

function BoardItem({
  board,
  active,
  onClick,
  onDelete,
}: {
  board: VaultBoard;
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`group flex items-center justify-between rounded-md px-2 py-1.5 cursor-pointer text-sm transition-colors ${
        active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
      }`}
      onClick={onClick}
    >
      <span className="truncate">{board.name}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs ml-2 shrink-0"
      >
        ×
      </button>
    </div>
  );
}

export function BoardList({ spaces, boards }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const activeBoardId = params.get("boardId") ? Number(params.get("boardId")) : null;

  const [addingType, setAddingType] = useState<null | "board" | "space" | { boardInSpace: number }>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [collapsedSpaces, setCollapsedSpaces] = useState<Set<number>>(new Set());
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const rootBoards = boards.filter((b) => b.spaceId === null);

  function navigate(id: number) {
    router.push(`/eden?boardId=${id}`);
  }

  function handleDeleteBoard(id: number) {
    const fd = new FormData();
    fd.set("id", String(id));
    startTransition(async () => {
      try {
        await deleteBoard(fd);
        if (activeBoardId === id) router.push("/eden");
      } catch { toast.error("Failed to delete board"); }
    });
  }

  function handleDeleteSpace(id: number) {
    const fd = new FormData();
    fd.set("id", String(id));
    startTransition(async () => {
      try {
        await deleteSpace(fd);
        toast.success("Space eliminado");
      } catch { toast.error("Failed to delete space"); }
    });
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = inputRef.current?.value.trim();
    if (!name) { setAddingType(null); return; }

    const fd = new FormData();
    fd.set("name", name);

    startTransition(async () => {
      try {
        if (addingType === "board") {
          await createBoard(fd);
          toast.success("Board creado");
        } else if (addingType === "space") {
          fd.set("position", String(spaces.length));
          await createSpace(fd);
          toast.success("Space creado");
        } else if (typeof addingType === "object" && addingType !== null) {
          fd.set("spaceId", String(addingType.boardInSpace));
          await createBoard(fd);
          toast.success("Board creado");
        }
        setAddingType(null);
      } catch { toast.error("Failed to create"); }
    });
  }

  function toggleSpace(id: number) {
    setCollapsedSpaces((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-0.5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          Boards
        </span>
        <div className="relative">
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground w-5 h-5 flex items-center justify-center rounded hover:bg-muted/60 transition-colors"
          >
            +
          </button>
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 top-6 z-20 bg-popover border border-border rounded-lg shadow-lg py-1 w-40 text-sm">
                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-accent transition-colors flex items-center gap-2"
                  onClick={() => {
                    setShowDropdown(false);
                    setAddingType("board");
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                >
                  <span className="text-muted-foreground text-xs">▣</span> New board
                </button>
                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-accent transition-colors flex items-center gap-2"
                  onClick={() => {
                    setShowDropdown(false);
                    setAddingType("space");
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                >
                  <span className="text-muted-foreground text-xs">○</span> New space
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Root boards (no space) */}
      {rootBoards.map((board) => (
        <BoardItem
          key={board.id}
          board={board}
          active={activeBoardId === board.id}
          onClick={() => navigate(board.id)}
          onDelete={() => handleDeleteBoard(board.id)}
        />
      ))}

      {/* Spaces */}
      {spaces.map((space) => {
        const spaceBoards = boards.filter((b) => b.spaceId === space.id);
        const collapsed = collapsedSpaces.has(space.id);
        return (
          <div key={space.id} className="mt-2">
            <div
              className="group flex items-center justify-between rounded-md px-2 py-1 cursor-pointer hover:bg-accent/30 transition-colors"
              onClick={() => toggleSpace(space.id)}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] text-muted-foreground/60 shrink-0">
                  {collapsed ? "▶" : "▼"}
                </span>
                <span className="text-xs font-medium truncate text-foreground/80">{space.name}</span>
                <span className="text-[10px] text-muted-foreground/30 shrink-0">{spaceBoards.length}</span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddingType({ boardInSpace: space.id });
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="text-muted-foreground hover:text-foreground text-xs w-4 h-4 flex items-center justify-center rounded hover:bg-muted/60"
                  title="Add board"
                >
                  +
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSpace(space.id); }}
                  className="text-muted-foreground hover:text-destructive text-xs w-4 h-4 flex items-center justify-center rounded hover:bg-destructive/10"
                >
                  ×
                </button>
              </div>
            </div>

            {!collapsed && (
              <div className="pl-3 mt-0.5 space-y-0.5 border-l border-border/40 ml-2">
                {spaceBoards.map((board) => (
                  <BoardItem
                    key={board.id}
                    board={board}
                    active={activeBoardId === board.id}
                    onClick={() => navigate(board.id)}
                    onDelete={() => handleDeleteBoard(board.id)}
                  />
                ))}
                {spaceBoards.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/40 px-2 py-1">No boards</p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Inline input */}
      {addingType !== null && (
        <form onSubmit={handleCreate} className="mt-2">
          <input
            ref={inputRef}
            placeholder={addingType === "space" ? "Nombre del space" : "Nombre del board"}
            className="w-full text-sm rounded-md border border-border bg-card px-2.5 py-1.5 focus:outline-none focus:border-ring/60"
            onBlur={() => setAddingType(null)}
            onKeyDown={(e) => e.key === "Escape" && setAddingType(null)}
            autoFocus
          />
        </form>
      )}

      {boards.length === 0 && spaces.length === 0 && addingType === null && (
        <p className="text-xs text-muted-foreground/50 px-2 py-4 text-center">
          Creá tu primer board
        </p>
      )}
    </div>
  );
}
