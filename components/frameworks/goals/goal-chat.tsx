"use client";

import { useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart, type UIMessagePart, type UIDataTypes, type UITools } from "ai";
import type { Goal, Task } from "@/lib/db/goals-schema";

interface Props {
  goals: Goal[];
  tasks: Task[];
}

function buildGoalContext(goals: Goal[], tasks: Task[]): string {
  if (goals.length === 0) return "No active goals yet.";
  return goals
    .map((g) => {
      const goalTasks = tasks.filter((t) => t.goalId === g.id);
      const done = goalTasks.filter((t) => t.status === "done").length;
      const lines = [`**${g.title}** (${g.horizon}) — ${done}/${goalTasks.length} tasks`];
      if (g.result) lines.push(`Result: ${g.result}`);
      if (g.purpose) lines.push(`Why: ${g.purpose}`);
      if (goalTasks.length > 0) {
        const pending = goalTasks.filter((t) => t.status !== "done");
        if (pending.length > 0) {
          lines.push(`Pending: ${pending.map((t) => `${t.title} [${t.priority}]`).join(", ")}`);
        }
      }
      return lines.join("\n");
    })
    .join("\n\n---\n\n");
}

function getMessageText(parts: UIMessagePart<UIDataTypes, UITools>[]): string {
  return parts.filter(isTextUIPart).map((p) => p.text).join("");
}

export function GoalChat({ goals, tasks }: Props) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const goalContext = buildGoalContext(goals, tasks);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/goals-chat",
        body: { goalContext },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [goalContext]
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

  return (
    <div className={`flex-shrink-0 flex flex-col border-l border-border transition-all duration-200 ${open ? "w-80" : "w-10"}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border/60 shrink-0">
        {open && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">Coach IA</span>
            <span className="text-[10px] text-muted-foreground/50 bg-muted/40 rounded px-1.5 py-0.5">
              {goals.length} metas
            </span>
          </div>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-muted-foreground hover:text-foreground transition-colors text-xs w-6 h-6 flex items-center justify-center rounded hover:bg-muted/50 shrink-0 ml-auto"
          title={open ? "Cerrar coach" : "Abrir coach"}
        >
          {open ? "✕" : "🤖"}
        </button>
      </div>

      {open && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">🤖</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Soy tu Coach IA. Conozco todas tus metas y tareas. Preguntame qué hacer hoy, cómo priorizar, o pedime que te ayude a definir mejor una meta.
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
                </div>
              );
            })}
            {isLoading && (
              <div className="bg-muted rounded-xl px-3 py-2 mr-2">
                <span className="text-xs text-muted-foreground animate-pulse">Pensando...</span>
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
              placeholder="Preguntale al coach..."
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
