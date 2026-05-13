"use client";

import { useState, useRef, useTransition } from "react";
import { updateTask, deleteTask } from "@/app/(dashboard)/goals/actions";
import { toast } from "sonner";
import type { Task } from "@/lib/db/goals-schema";
import { CalendarDays } from "lucide-react";

// Status cycle: todo → in_progress → done → blocked → todo
const STATUS_CYCLE = ["todo", "in_progress", "done", "blocked"] as const;
type TaskStatus = (typeof STATUS_CYCLE)[number];

function nextStatus(current: string): TaskStatus {
  const idx = STATUS_CYCLE.indexOf(current as TaskStatus);
  if (idx === -1) return "todo";
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

// Unicode dot indicators per status
const STATUS_ICON: Record<string, string> = {
  todo: "○",
  in_progress: "◑",
  done: "●",
  blocked: "⊘",
};

const STATUS_STYLE: Record<string, string> = {
  todo: "text-foreground/20",
  in_progress: "text-foreground/55",
  done: "text-foreground/85",
  blocked: "text-foreground/15",
};

// Priority cycle: high → medium → low → high
const PRIORITY_CYCLE = ["high", "medium", "low"] as const;
type TaskPriority = (typeof PRIORITY_CYCLE)[number];

function nextPriority(current: string): TaskPriority {
  const idx = PRIORITY_CYCLE.indexOf(current as TaskPriority);
  if (idx === -1) return "medium";
  return PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length];
}

const PRIORITY_LABELS: Record<string, string> = {
  high: "H",
  medium: "M",
  low: "L",
};

const PRIORITY_STYLE: Record<string, string> = {
  high: "text-foreground/80",
  medium: "text-foreground/55",
  low: "text-foreground/30",
};

function formatDate(d: string | null | undefined): string {
  if (!d) return "";
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

interface Props {
  task: Task;
}

export function TaskItem({ task }: Props) {
  const [, startTransition] = useTransition();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [editingDeadline, setEditingDeadline] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // ── Status cycle ──────────────────────────────────────────────────────────
  function handleStatusClick() {
    const fd = new FormData();
    fd.set("id", String(task.id));
    fd.set("status", nextStatus(task.status));
    startTransition(async () => {
      try {
        await updateTask(fd);
      } catch {
        toast.error("No se pudo actualizar la tarea");
      }
    });
  }

  // ── Priority cycle ────────────────────────────────────────────────────────
  function handlePriorityClick(e: React.MouseEvent) {
    e.stopPropagation();
    const fd = new FormData();
    fd.set("id", String(task.id));
    fd.set("priority", nextPriority(task.priority));
    startTransition(async () => {
      try {
        await updateTask(fd);
      } catch {
        toast.error("No se pudo actualizar la tarea");
      }
    });
  }

  // ── Title editing ─────────────────────────────────────────────────────────
  function startEditTitle(e: React.MouseEvent) {
    e.stopPropagation();
    setTitleDraft(task.title);
    setEditingTitle(true);
    // Focus is handled via autoFocus on the input
  }

  function commitTitle() {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === task.title) {
      setEditingTitle(false);
      setTitleDraft(task.title);
      return;
    }
    const fd = new FormData();
    fd.set("id", String(task.id));
    fd.set("title", trimmed);
    startTransition(async () => {
      try {
        await updateTask(fd);
      } catch {
        toast.error("No se pudo actualizar la tarea");
      }
    });
    setEditingTitle(false);
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitTitle();
    } else if (e.key === "Escape") {
      setEditingTitle(false);
      setTitleDraft(task.title);
    }
  }

  // ── Deadline editing ──────────────────────────────────────────────────────
  function handleDeadlineChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fd = new FormData();
    fd.set("id", String(task.id));
    fd.set("deadline", e.target.value);
    startTransition(async () => {
      try {
        await updateTask(fd);
      } catch {
        toast.error("No se pudo actualizar la fecha");
      }
    });
    setEditingDeadline(false);
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    const fd = new FormData();
    fd.set("id", String(task.id));
    startTransition(async () => {
      try {
        await deleteTask(fd);
      } catch {
        toast.error("Failed to delete task");
      }
    });
  }

  const isDone = task.status === "done";

  return (
    <div className="group flex items-start gap-2 py-1 px-1 rounded-lg hover:bg-accent/30 transition-colors">
      {/* Status indicator — cycles on click */}
      <button
        onClick={handleStatusClick}
        title={`Estado: ${task.status} — clic para avanzar`}
        className={`mt-0.5 text-base leading-none shrink-0 transition-colors hover:opacity-80 select-none ${
          STATUS_STYLE[task.status] ?? "text-foreground/20"
        }`}
      >
        {STATUS_ICON[task.status] ?? "○"}
      </button>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        {editingTitle ? (
          <input
            ref={titleInputRef}
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={handleTitleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-sm bg-transparent border-b border-border focus:outline-none focus:border-ring/60 pb-0.5"
          />
        ) : (
          <span
            onClick={startEditTitle}
            className={`text-sm cursor-text select-text block truncate ${
              isDone ? "line-through text-muted-foreground" : ""
            }`}
          >
            {task.title}
          </span>
        )}

        {/* Description */}
        {task.description && (
          <p className="text-[11px] text-muted-foreground/40 truncate leading-snug mt-0.5">
            {task.description}
          </p>
        )}

        {/* Deadline row */}
        {(task.deadline || editingDeadline) && (
          <div className="mt-0.5">
            {editingDeadline ? (
              <input
                type="date"
                autoFocus
                defaultValue={task.deadline ?? ""}
                onChange={handleDeadlineChange}
                onBlur={() => setEditingDeadline(false)}
                className="text-[10px] bg-transparent border-b border-border focus:outline-none focus:border-ring/60"
              />
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingDeadline(true);
                }}
                className="flex items-center gap-1 text-[10px] text-foreground/35 hover:text-foreground/60 transition-colors"
              >
                <CalendarDays className="w-3 h-3" />
                {formatDate(task.deadline)}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Priority badge — cycles on click */}
      <button
        onClick={handlePriorityClick}
        title={`Prioridad: ${task.priority} — clic para cambiar`}
        className={`text-[10px] font-mono font-semibold shrink-0 mt-0.5 hover:opacity-70 transition-opacity select-none ${
          PRIORITY_STYLE[task.priority] ?? "text-foreground/55"
        }`}
      >
        {PRIORITY_LABELS[task.priority] ?? task.priority}
      </button>

      {/* Delete */}
      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs w-4 h-4 flex items-center justify-center shrink-0 mt-0.5 transition-opacity"
        title="Eliminar tarea"
      >
        ×
      </button>
    </div>
  );
}
