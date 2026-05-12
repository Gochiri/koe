"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import type { VaultItem } from "@/lib/db/vault-schema";

interface Props {
  items: VaultItem[];
}

function buildContext(items: VaultItem[]): string {
  if (items.length === 0) return "El board está vacío.";
  return items
    .map((item) => {
      const parts: string[] = [];
      if (item.title) parts.push(`**${item.title}**`);
      if (item.body) parts.push(item.body);
      return `[${item.kind.toUpperCase()}] ${parts.join("\n")}`;
    })
    .join("\n\n---\n\n");
}

export function BoardChat({ items }: Props) {
  const [open, setOpen] = useState(false);
  const boardContext = buildContext(items);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/vault-chat",
    body: { boardContext },
  });

  return (
    <div className="flex-shrink-0 w-80 flex flex-col border-l border-border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-accent/50 transition-colors"
      >
        <span>Chat con el board</span>
        <span className="text-muted-foreground text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-[60vh]">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground">
                El asistente tiene acceso a todo el contenido de este board. Preguntale lo que quieras.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`text-sm rounded-lg px-3 py-2 ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground ml-6"
                    : "bg-muted mr-6"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
            {isLoading && (
              <div className="bg-muted rounded-lg px-3 py-2 mr-6">
                <span className="text-xs text-muted-foreground">Escribiendo...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border px-4 py-3 flex gap-2">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Preguntá algo..."
              className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground"
            />
            <Button type="submit" size="sm" disabled={isLoading || !input.trim()}>
              →
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
