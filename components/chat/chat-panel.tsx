// @ts-nocheck — legacy chat UI, not used in current nav
"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageItem } from "./message-item";
import { MentionPicker } from "./mention-picker";
import type { ChatConversation, ChatMessage, ChatMention } from "@/lib/db/schema";
import type { MentionSearchResult } from "@/lib/chat/mentions";
import {
  createConversation,
  deleteConversation,
  renameConversation,
  loadConversationMessages,
  listConversations,
  sendMessage,
} from "@/app/(dashboard)/chat/actions";
import { Sparkles, Send, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

export function ChatPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [mentions, setMentions] = useState<ChatMention[]>([]);
  const [pending, startSend] = useTransition();
  const [, startBoot] = useTransition();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async (selectId?: number) => {
    const list = await listConversations();
    setConversations(list);
    const targetId =
      selectId ??
      (activeId && list.some((c) => c.id === activeId) ? activeId : list[0]?.id ?? null);
    setActiveId(targetId);
    if (targetId) {
      const msgs = await loadConversationMessages(targetId);
      setMessages(msgs);
    } else {
      setMessages([]);
    }
  }, [activeId]);

  // Boot once when sheet first opens
  useEffect(() => {
    if (open) {
      startBoot(async () => {
        await refresh();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Detect "@" in textarea to trigger mention picker
  function handleTextChange(v: string) {
    setText(v);
    const cursor = textareaRef.current?.selectionStart ?? v.length;
    const beforeCursor = v.slice(0, cursor);
    const match = beforeCursor.match(/@([\w\sÃ¡Ã©Ã­Ã³ÃºÃ±-]*)$/i);
    if (match) {
      setMentionQuery(match[1] ?? "");
    } else {
      setMentionQuery(null);
    }
  }

  function insertMention(m: MentionSearchResult) {
    // Replace the trailing "@..." with the label and add to mentions array
    const ta = textareaRef.current;
    if (!ta) return;
    const cursor = ta.selectionStart;
    const before = text.slice(0, cursor);
    const after = text.slice(cursor);
    const newBefore = before.replace(/@([\w\sÃ¡Ã©Ã­Ã³ÃºÃ±-]*)$/i, `@${m.label} `);
    const newText = newBefore + after;
    setText(newText);
    setMentions((prev) => {
      // Dedupe by type+id
      if (prev.some((p) => p.type === m.type && p.id === m.id)) return prev;
      return [...prev, { type: m.type, id: m.id, label: m.label }];
    });
    setMentionQuery(null);
    queueMicrotask(() => {
      ta.focus();
      const pos = newBefore.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  async function handleNewConversation() {
    try {
      const id = await createConversation();
      await refresh(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  async function handleDeleteConversation(id: number) {
    if (!confirm("Â¿Borrar esta conversaciÃ³n? No se puede deshacer.")) return;
    try {
      const fd = new FormData();
      fd.set("id", String(id));
      await deleteConversation(fd);
      toast.success("ConversaciÃ³n borrada");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  async function handleRename() {
    if (!activeId || !titleDraft.trim()) {
      setEditingTitle(false);
      return;
    }
    try {
      const fd = new FormData();
      fd.set("id", String(activeId));
      fd.set("title", titleDraft);
      await renameConversation(fd);
      setEditingTitle(false);
      await refresh(activeId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  async function handleSend() {
    if (!text.trim() || pending) return;
    const payload = { text: text.trim(), mentions: [...mentions] };

    startSend(async () => {
      try {
        let convId = activeId;
        if (!convId) {
          convId = await createConversation();
          setActiveId(convId);
        }
        setText("");
        setMentions([]);
        setMentionQuery(null);

        const res = await sendMessage({
          conversationId: convId,
          text: payload.text,
          mentions: payload.mentions,
        });

        setMessages((m) => [...m, res.userMessage, res.assistantMessage]);

        if (res.cacheStats) {
          const { read, written } = res.cacheStats;
          if (read > 0 || written > 0) {
            // Subtle dev signal â€” comment out if noisy
            console.log(`[chat] cache read=${read} written=${written}`);
          }
        }

        await refresh(convId);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  const activeConv = conversations.find((c) => c.id === activeId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col gap-0"
      >
        <SheetHeader className="border-b p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <SheetTitle className="text-base">Chat con Dan Koe</SheetTitle>
          </div>
          <SheetDescription className="sr-only">
            Chat con el saber de Dan Koe. MencionÃ¡ entidades de tu dashboard con @.
          </SheetDescription>

          <div className="flex items-center gap-1.5">
            <Select
              value={activeId ? String(activeId) : ""}
              onValueChange={(v) => {
                if (!v) return;
                const id = Number(v);
                setActiveId(id);
                startBoot(async () => {
                  const msgs = await loadConversationMessages(id);
                  setMessages(msgs);
                });
              }}
            >
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Sin conversaciones" />
              </SelectTrigger>
              <SelectContent>
                {conversations.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={handleNewConversation}
              title="Nueva conversaciÃ³n"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
            {activeConv && !editingTitle && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  title="Renombrar"
                  onClick={() => {
                    setTitleDraft(activeConv.title);
                    setEditingTitle(true);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  title="Borrar conversaciÃ³n"
                  onClick={() => handleDeleteConversation(activeConv.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>

          {editingTitle && (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                className="flex-1 h-8 px-2 text-xs border rounded-md bg-background"
                placeholder="TÃ­tulo de la conversaciÃ³n"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") setEditingTitle(false);
                }}
              />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleRename}>
                <Check className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setEditingTitle(false)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1 px-4 py-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-sm text-muted-foreground py-12 gap-2">
              <Sparkles className="w-8 h-8 opacity-40" />
              <p>Preguntale algo a Dan Koe.</p>
              <p className="text-xs">
                ProbÃ¡: <em>"CÃ³mo armo un APAG sobre productividad?"</em>{" "}
                o mencionÃ¡ entidades con <code>@</code>.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <MessageItem
                  key={m.id}
                  message={m}
                  onChanged={() => activeId && refresh(activeId)}
                />
              ))}
              <div ref={scrollEndRef} />
            </div>
          )}
          {pending && (
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" />
              Pensando...
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-3 space-y-2 relative">
          {mentions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {mentions.map((m) => (
                <Badge
                  key={`${m.type}-${m.id}`}
                  variant="secondary"
                  className="text-[10px] gap-1 pr-1"
                >
                  @{m.label}
                  <button
                    type="button"
                    onClick={() =>
                      setMentions((prev) =>
                        prev.filter((p) => !(p.type === m.type && p.id === m.id))
                      )
                    }
                    className="hover:bg-foreground/10 rounded-full p-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {mentionQuery !== null && (
            <div className="absolute bottom-full left-3 right-3 mb-2 z-10">
              <MentionPicker
                query={mentionQuery}
                onSelect={insertMention}
                onClose={() => setMentionQuery(null)}
              />
            </div>
          )}

          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="EscribÃ­... (@ para mencionar)"
              rows={2}
              className="resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !mentionQuery) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={pending}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={pending || !text.trim()}
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Enter para enviar Â· Shift+Enter para nueva lÃ­nea Â· @ para mencionar
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

