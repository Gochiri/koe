"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart, type UIMessagePart, type UIDataTypes, type UITools } from "ai";
import { createItem } from "@/app/(dashboard)/eden/actions";
import { toast } from "sonner";
import type { VaultItem } from "@/lib/db/vault-schema";

interface Props {
  items: VaultItem[];
  boardId: number;
  activeSectionId?: number;
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

function getMessageText(parts: UIMessagePart<UIDataTypes, UITools>[]): string {
  return parts
    .filter(isTextUIPart)
    .map((p) => p.text)
    .join("");
}

export function BoardChat({ items, boardId, activeSectionId }: Props) {
  const [open, setOpen] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const boardContext = buildContext(items);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/vault-chat",
        body: { boardContext },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [boardContext]
  );

  const { messages, sendMessage, status } = useChat({
    transport,
    onFinish: () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading) return;
    setInputValue("");
    sendMessage({ role: "user", parts: [{ type: "text", text }] });
  }

  function saveAsDoc(messageId: string, content: string) {
    setSavingId(messageId);
    const fd = new FormData();
    fd.set("boardId", String(boardId));
    fd.set("kind", "doc");
    fd.set("title", "Chat — " + content.slice(0, 60).replace(/\n/g, " ") + (content.length > 60 ? "…" : ""));
    fd.set("body", content);
    if (activeSectionId) fd.set("sectionId", String(activeSectionId));
    startTransition(async () => {
      try {
        await createItem(fd);
        toast.success("Guardado como doc en el board");
      } catch {
        toast.error("Error al guardar");
      } finally {
        setSavingId(null);
      }
    });
  }

  return (
    <div className={`flex-shrink-0 flex flex-col border-l border-border transition-all duration-200 ${open ? "w-80" : "w-10"}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border/60 shrink-0">
        {open && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">Chat</span>
            <span className="text-[10px] text-muted-foreground/50 bg-muted/40 rounded px-1.5 py-0.5">
              {items.length} items
            </span>
          </div>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-muted-foreground hover:text-foreground transition-colors text-xs w-6 h-6 flex items-center justify-center rounded hover:bg-muted/50 shrink-0 ml-auto"
          title={open ? "Cerrar chat" : "Abrir chat"}
        >
          {open ? "✕" : "💬"}
        </button>
      </div>

      {open && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">💬</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tengo acceso a todo el contenido de este board. Preguntame lo que quieras.
                </p>
              </div>
            )}
            {messages.map((m) => {
              const text = getMessageText(m.parts as UIMessagePart<UIDataTypes, UITools>[]);
              return (
                <div key={m.id} className={`space-y-1 ${m.role === "user" ? "items-end flex flex-col" : ""}`}>
                  <div
                    className={`text-sm rounded-xl px-3 py-2 leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground ml-4"
                        : "bg-muted mr-2"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{text}</p>
                  </div>
                  {m.role === "assistant" && text && (
                    <button
                      onClick={() => saveAsDoc(m.id, text)}
                      disabled={savingId === m.id}
                      className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors px-1 disabled:opacity-40"
                    >
                      {savingId === m.id ? "Guardando..." : "💾 Guardar como doc"}
                    </button>
                  )}
                </div>
              );
            })}
            {isLoading && (
              <div className="bg-muted rounded-xl px-3 py-2 mr-2">
                <span className="text-xs text-muted-foreground animate-pulse">Escribiendo...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-border px-3 py-3 flex gap-2 shrink-0"
          >
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Preguntá sobre el board..."
              className="flex-1 text-sm bg-muted/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/40"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="text-sm font-medium text-primary w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-30 shrink-0"
            >
              ↑
            </button>
          </form>
        </>
      )}
    </div>
  );
}
