"use client";

import { useState, useTransition } from "react";
import { updateMilestone, deleteMilestone } from "@/app/(dashboard)/goals/actions";
import { toast } from "sonner";
import type { Milestone } from "@/lib/db/goals-schema";

interface Props {
  milestone: Milestone;
}

export function MilestoneItem({ milestone }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(milestone.title);
  const [, startTransition] = useTransition();

  function handleToggle() {
    const fd = new FormData();
    fd.set("id", String(milestone.id));
    fd.set("completed", String(!milestone.completed));
    startTransition(async () => {
      try { await updateMilestone(fd); }
      catch { toast.error("Failed to update milestone"); }
    });
  }

  function commitTitle() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === milestone.title) { setEditing(false); setDraft(milestone.title); return; }
    const fd = new FormData();
    fd.set("id", String(milestone.id));
    fd.set("title", trimmed);
    startTransition(async () => {
      try { await updateMilestone(fd); setEditing(false); }
      catch { toast.error("Failed to update milestone"); }
    });
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    const fd = new FormData();
    fd.set("id", String(milestone.id));
    startTransition(async () => {
      try { await deleteMilestone(fd); }
      catch { toast.error("Failed to delete milestone"); }
    });
  }

  return (
    <div className="group flex items-start gap-2 py-1">
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={`w-3.5 h-3.5 mt-0.5 rounded-sm border shrink-0 flex items-center justify-center transition-colors ${
          milestone.completed
            ? "bg-foreground/50 border-foreground/50"
            : "border-border/60 hover:border-foreground/40"
        }`}
        title={milestone.completed ? "Mark incomplete" : "Mark complete"}
      >
        {milestone.completed && (
          <svg viewBox="0 0 8 8" className="w-2 h-2 text-background fill-current">
            <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Title */}
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commitTitle(); }
            else if (e.key === "Escape") { setEditing(false); setDraft(milestone.title); }
          }}
          className="flex-1 text-sm bg-transparent border-b border-border focus:outline-none focus:border-foreground/40 pb-0.5"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={`flex-1 text-sm cursor-text select-text ${
            milestone.completed ? "line-through text-muted-foreground/50" : "text-foreground/80"
          }`}
        >
          {milestone.title}
        </span>
      )}

      {/* Delete */}
      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs w-4 h-4 flex items-center justify-center shrink-0 mt-0.5 transition-opacity"
        title="Delete milestone"
      >
        ×
      </button>
    </div>
  );
}
