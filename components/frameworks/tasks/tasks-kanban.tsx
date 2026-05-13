"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/lib/db/goals-schema";
import { updateTask } from "@/app/(dashboard)/goals/actions";
import { toast } from "sonner";

const COLUMNS = [
  { key: "todo",        label: "Por hacer" },
  { key: "in_progress", label: "En progreso" },
  { key: "done",        label: "Listo" },
  { key: "blocked",     label: "Bloqueado" },
] as const;

type TaskStatus = (typeof COLUMNS)[number]["key"];

const PRIORITY_STYLE: Record<string, string> = {
  high:   "text-foreground/80",
  medium: "text-foreground/50",
  low:    "text-foreground/25",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "H", medium: "M", low: "L",
};

interface Props {
  tasks: Task[];
}

function KanbanCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-lg border border-border/60 bg-card px-3 py-2.5 cursor-grab active:cursor-grabbing select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-foreground/80 leading-snug">{task.title}</p>
        <span className={`text-[10px] font-mono font-semibold shrink-0 ${PRIORITY_STYLE[task.priority] ?? "text-foreground/50"}`}>
          {PRIORITY_LABELS[task.priority] ?? task.priority}
        </span>
      </div>
      {task.deadline && (
        <p className="text-[10px] text-foreground/35 mt-1 tabular-nums">{task.deadline}</p>
      )}
    </div>
  );
}

export function TasksKanban({ tasks }: Props) {
  const [localTasks, setLocalTasks] = useState(tasks);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const activeTask = activeId ? localTasks.find((t) => t.id === activeId) : null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(Number(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const colKey = COLUMNS.find((c) => c.key === over.id)?.key as TaskStatus | undefined;
    const targetStatus: TaskStatus | undefined = colKey ?? (() => {
      const targetTask = localTasks.find((t) => t.id === Number(over.id));
      return targetTask?.status as TaskStatus | undefined;
    })();

    if (!targetStatus) return;

    const draggedTask = localTasks.find((t) => t.id === Number(active.id));
    if (!draggedTask || draggedTask.status === targetStatus) return;

    // Optimistic update
    setLocalTasks((prev) =>
      prev.map((t) => t.id === Number(active.id) ? { ...t, status: targetStatus } : t)
    );

    const fd = new FormData();
    fd.set("id", String(active.id));
    fd.set("status", targetStatus);
    startTransition(async () => {
      try { await updateTask(fd); }
      catch {
        toast.error("No se pudo mover la tarea");
        setLocalTasks(tasks); // revert
      }
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colTasks = localTasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="flex-shrink-0 w-64 flex flex-col gap-2">
              {/* Column header */}
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
                  {col.label}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/35">{colTasks.length}</span>
              </div>

              {/* Drop zone */}
              <SortableContext
                id={col.key}
                items={colTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  data-droppable-id={col.key}
                  className="flex-1 min-h-24 rounded-xl border border-border/40 bg-background/50 p-2 space-y-2"
                >
                  {colTasks.map((task) => (
                    <KanbanCard key={task.id} task={task} />
                  ))}
                  {colTasks.length === 0 && (
                    <div className="h-16 flex items-center justify-center">
                      <span className="text-[11px] text-muted-foreground/30">Soltá aquí</span>
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-lg opacity-90 w-64">
            <p className="text-sm font-medium">{activeTask.title}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
