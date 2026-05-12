"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBoard, deleteBoard } from "@/app/(dashboard)/vault/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { VaultBoard } from "@/lib/db/vault-schema";

interface Props {
  boards: VaultBoard[];
}

export function BoardList({ boards }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const activeBoardId = params.get("boardId") ? Number(params.get("boardId")) : null;

  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleBoardClick(id: number) {
    router.push(`/vault?boardId=${id}`);
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createBoard(fd);
        setAdding(false);
        toast.success("Board creado");
      } catch {
        toast.error("Error al crear board");
      }
    });
  }

  function handleDelete(id: number) {
    const fd = new FormData();
    fd.set("id", String(id));
    startTransition(async () => {
      try {
        await deleteBoard(fd);
        if (activeBoardId === id) router.push("/vault");
        toast.success("Board eliminado");
      } catch {
        toast.error("Error al eliminar");
      }
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Boards
        </span>
        <button
          onClick={() => {
            setAdding(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          + Nuevo
        </button>
      </div>

      {boards.map((board) => (
        <div
          key={board.id}
          className={`group flex items-center justify-between rounded-md px-2 py-1.5 cursor-pointer text-sm transition-colors ${
            activeBoardId === board.id
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50"
          }`}
          onClick={() => handleBoardClick(board.id)}
        >
          <span className="truncate">{board.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(board.id);
            }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs ml-2"
          >
            ×
          </button>
        </div>
      ))}

      {adding && (
        <form onSubmit={handleCreate} className="mt-2">
          <Input
            ref={inputRef}
            name="name"
            placeholder="Nombre del board"
            className="h-7 text-sm"
            onBlur={() => setAdding(false)}
            onKeyDown={(e) => e.key === "Escape" && setAdding(false)}
          />
        </form>
      )}

      {boards.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground px-2 py-4 text-center">
          Creá tu primer board
        </p>
      )}
    </div>
  );
}
