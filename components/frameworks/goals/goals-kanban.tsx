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
import type { Goal, Task, Milestone } from "@/lib/db/goals-schema";
import { updateGoal } from "@/app/(dashboard)/goals/actions";
import { toast } from "sonner";

const COLUMNS = [
  { key: "not_started", label: "Sin iniciar" },
  { key: "active",      label: "En progreso" },
  { key: "paused",      label: "Pausada" },
  { key: "completed",   label: "Completada" },
] as const;

type GoalStatus = (typeof COLUMNS)[number]["key"];

interface Props {
  goals: Goal[];
  tasks: Task[];
  milestones: Milestone[];
}

function KanbanCard({ goal, tasks }: { goal: Goal; tasks: Task[] }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: goal.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const done = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-lg border border-border/60 bg-card px-3 py-2.5 cursor-grab active:cursor-grabbing select-none"
    >
      <p className="text-sm font-medium text-foreground/80 leading-snug">{goal.title}</p>
      {total > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-0.5 bg-foreground/[0.07] rounded-full overflow-hidden">
            <div className="h-full bg-foreground/30 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] text-muted-foreground/50 tabular-nums">{done}/{total}</span>
        </div>
      )}
    </div>
  );
}

export function GoalsKanban({ goals, tasks, milestones: _milestones }: Props) {
  const [localGoals, setLocalGoals] = useState(goals);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const activeGoal = activeId ? localGoals.find((g) => g.id === activeId) : null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(Number(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    // over.id could be a column key or another goal id
    const colKey = COLUMNS.find((c) => c.key === over.id)?.key as GoalStatus | undefined;
    const targetStatus: GoalStatus | undefined = colKey ?? (() => {
      const targetGoal = localGoals.find((g) => g.id === Number(over.id));
      return targetGoal?.status as GoalStatus | undefined;
    })();

    if (!targetStatus) return;

    const draggedGoal = localGoals.find((g) => g.id === Number(active.id));
    if (!draggedGoal || draggedGoal.status === targetStatus) return;

    // Optimistic update
    setLocalGoals((prev) =>
      prev.map((g) => g.id === Number(active.id) ? { ...g, status: targetStatus } : g)
    );

    const fd = new FormData();
    fd.set("id", String(active.id));
    fd.set("status", targetStatus);
    startTransition(async () => {
      try { await updateGoal(fd); }
      catch {
        toast.error("No se pudo mover la meta");
        setLocalGoals(goals); // revert
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
          const colGoals = localGoals.filter((g) => g.status === col.key);
          return (
            <div key={col.key} className="flex-shrink-0 w-64 flex flex-col gap-2">
              {/* Column header */}
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
                  {col.label}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/35">{colGoals.length}</span>
              </div>

              {/* Drop zone */}
              <SortableContext
                id={col.key}
                items={colGoals.map((g) => g.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  data-droppable-id={col.key}
                  className="flex-1 min-h-24 rounded-xl border border-border/40 bg-background/50 p-2 space-y-2"
                >
                  {colGoals.map((goal) => (
                    <KanbanCard
                      key={goal.id}
                      goal={goal}
                      tasks={tasks.filter((t) => t.goalId === goal.id)}
                    />
                  ))}
                  {colGoals.length === 0 && (
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
        {activeGoal && (
          <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-lg opacity-90">
            <p className="text-sm font-medium">{activeGoal.title}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
