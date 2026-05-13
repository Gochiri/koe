// @ts-nocheck — legacy chat UI, not used in current nav
"use client";

import { useState, useTransition } from "react";
import type { ChatMessage } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { editMessage, deleteMessage } from "@/app/(dashboard)/chat/actions";
import { Pencil, Trash2, Check, X, Sparkles, User } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export function MessageItem({
  message,
  onChanged,
}: {
  message: ChatMessage;
  onChanged?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [pending, start] = useTransition();
  const isUser = message.role === "user";

  return (
    <div
      className={`group flex gap-2 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 ${
          isUser
            ? "bg-foreground text-background"
            : "bg-muted text-foreground"
        }`}
      >
        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="text-sm bg-background text-foreground"
            />
            <div className="flex items-center gap-1 justify-end">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                disabled={pending}
                onClick={() => {
                  setEditing(false);
                  setDraft(message.content);
                }}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                disabled={pending || !draft.trim()}
                onClick={() => {
                  start(async () => {
                    try {
                      const fd = new FormData();
                      fd.set("id", String(message.id));
                      fd.set("content", draft);
                      await editMessage(fd);
                      toast.success("Editado");
                      setEditing(false);
                      onChanged?.();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Error");
                    }
                  });
                }}
              >
                <Check className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            {message.mentions.length > 0 && isUser && (
              <div className="flex flex-wrap gap-1 mb-1.5">
                {message.mentions.map((m) => (
                  <Badge
                    key={`${m.type}-${m.id}`}
                    variant="secondary"
                    className="text-[10px] bg-background/20 text-background border-background/30"
                  >
                    @{m.label}
                  </Badge>
                ))}
              </div>
            )}
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </p>
            <div className="flex items-center justify-between mt-1.5 gap-2">
              <span
                className={`text-[10px] ${
                  isUser ? "text-background/60" : "text-muted-foreground"
                }`}
              >
                {format(new Date(message.createdAt), "HH:mm")}
                {message.editedAt && " Â· editado"}
              </span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                <button
                  type="button"
                  className={`p-1 rounded hover:bg-background/20 ${
                    isUser ? "text-background/70" : "text-muted-foreground"
                  }`}
                  title="Editar"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  className={`p-1 rounded hover:bg-background/20 ${
                    isUser ? "text-background/70" : "text-muted-foreground"
                  }`}
                  title="Borrar"
                  onClick={() => {
                    if (!confirm("Â¿Borrar este mensaje?")) return;
                    start(async () => {
                      try {
                        const fd = new FormData();
                        fd.set("id", String(message.id));
                        await deleteMessage(fd);
                        toast.success("Borrado");
                        onChanged?.();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Error");
                      }
                    });
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-3.5 h-3.5 text-background" />
        </div>
      )}
    </div>
  );
}

