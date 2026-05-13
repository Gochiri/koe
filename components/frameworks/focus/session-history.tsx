"use client";

import { useTransition } from "react";
import { deleteSession } from "@/app/(dashboard)/focus/actions";
import { toast } from "sonner";
import type { FocusSession, Goal, Task } from "@/lib/db/goals-schema";

interface Props {
  sessions: FocusSession[];
  goals: Goal[];
  tasks: Task[];
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
}

export function SessionHistory({ sessions, goals, tasks }: Props) {
  const [, startTransition] = useTransition();

  function handleDelete(id: number) {
    const fd = new FormData();
    fd.set("id", String(id));
    startTransition(async () => {
      try { await deleteSession(fd); }
      catch { toast.error("Failed to delete session"); }
    });
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-6 text-center text-muted-foreground text-sm">
        No sessions this week. Start your first timer!
      </div>
    );
  }

  // Group by day
  const grouped = sessions.reduce<Record<string, FocusSession[]>>((acc, s) => {
    const key = new Date(s.startedAt).toDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60">
        <h3 className="text-sm font-semibold">Session history — last 7 days</h3>
      </div>
      <div className="divide-y divide-border/40">
        {Object.entries(grouped).map(([dayStr, daySessions]) => {
          const dayMinutes = daySessions.filter((s) => s.completed).reduce((s, x) => s + x.durationMinutes, 0);
          return (
            <div key={dayStr}>
              <div className="flex items-center justify-between px-4 py-2 bg-muted/20">
                <span className="text-xs font-medium text-muted-foreground">
                  {formatDate(new Date(dayStr))}
                </span>
                <span className="text-xs text-muted-foreground">{formatDuration(dayMinutes)}</span>
              </div>
              {daySessions.map((session) => {
                const goal = goals.find((g) => g.id === session.goalId);
                const task = tasks.find((t) => t.id === session.taskId);
                return (
                  <div key={session.id} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-accent/20 transition-colors">
                    <span className={`text-sm font-mono ${session.completed ? "text-foreground/60" : "text-muted-foreground/25"}`}>
                      {session.completed ? "·" : "○"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{formatDuration(session.durationMinutes)}</span>
                      {(goal || task) && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {task?.title ?? goal?.title}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground/50">
                      {new Date(session.startedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
