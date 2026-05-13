"use client";

import { useState, useTransition } from "react";
import { deleteGoal, updateGoal, createTask, createMilestone } from "@/app/(dashboard)/goals/actions";
import { toast } from "sonner";
import type { Goal, Task, Milestone } from "@/lib/db/goals-schema";
import { TaskItem } from "./task-item";
import { MilestoneItem } from "./milestone-item";
import { Pencil, Calendar, ChevronDown } from "lucide-react";

interface Props {
  goal: Goal;
  tasks: Task[];
  milestones: Milestone[];
}

const STATUS_LABELS: Record<string, string> = {
  not_started: "Sin iniciar",
  active: "Activa",
  completed: "Completada",
  paused: "Pausada",
};

const STATUS_STYLES: Record<string, string> = {
  not_started: "text-foreground/50",
  active: "text-foreground/70",
  paused: "text-foreground/40",
  completed: "text-foreground/30 line-through",
};

const HORIZON_LABELS: Record<string, string> = {
  "90days": "90d",
  "1year":  "1a",
  "3year":  "3a",
  lifetime: "∞",
};

function formatDate(d: string | null | undefined): string {
  if (!d) return "";
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

const SMART_FIELDS = [
  { key: "smartSpecific",   label: "Específica",   placeholder: "¿Qué exactamente querés lograr?" },
  { key: "smartMeasurable", label: "Medible",       placeholder: "¿Cómo vas a medir el éxito?" },
  { key: "smartAchievable", label: "Alcanzable",    placeholder: "¿Es esto realista?" },
  { key: "smartRelevant",   label: "Relevante",     placeholder: "¿Por qué importa para tu visión de vida?" },
  { key: "smartTimeBound",  label: "Con tiempo",    placeholder: "¿Para cuándo específicamente?" },
] as const;

export function GoalCard({ goal, tasks, milestones }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [smartOpen, setSmartOpen] = useState(false);
  const [, startTransition] = useTransition();

  // Edit form state
  const [editTitle, setEditTitle] = useState(goal.title);
  const [editResult, setEditResult] = useState(goal.result ?? "");
  const [editPurpose, setEditPurpose] = useState(goal.purpose ?? "");
  const [editHorizon, setEditHorizon] = useState(goal.horizon);
  const [editDeadline, setEditDeadline] = useState(goal.deadline ?? "");
  const [editStatus, setEditStatus] = useState(goal.status);
  const [editSmart, setEditSmart] = useState({
    smartSpecific: goal.smartSpecific ?? "",
    smartMeasurable: goal.smartMeasurable ?? "",
    smartAchievable: goal.smartAchievable ?? "",
    smartRelevant: goal.smartRelevant ?? "",
    smartTimeBound: goal.smartTimeBound ?? "",
  });

  const done = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const completedMilestones = milestones.filter((m) => m.completed).length;
  const hasSmart = SMART_FIELDS.some((f) => goal[f.key]);

  function handleDelete() {
    const fd = new FormData();
    fd.set("id", String(goal.id));
    startTransition(async () => {
      try { await deleteGoal(fd); }
      catch { toast.error("No se pudo eliminar la meta"); }
    });
  }

  function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editTitle.trim()) return;
    const fd = new FormData();
    fd.set("id", String(goal.id));
    fd.set("title", editTitle.trim());
    fd.set("result", editResult);
    fd.set("purpose", editPurpose);
    fd.set("horizon", editHorizon);
    fd.set("deadline", editDeadline);
    fd.set("status", editStatus);
    Object.entries(editSmart).forEach(([k, v]) => fd.set(k, v));
    startTransition(async () => {
      try { await updateGoal(fd); setEditing(false); }
      catch { toast.error("No se pudo actualizar la meta"); }
    });
  }

  function handleEditCancel() {
    setEditTitle(goal.title);
    setEditResult(goal.result ?? "");
    setEditPurpose(goal.purpose ?? "");
    setEditHorizon(goal.horizon);
    setEditDeadline(goal.deadline ?? "");
    setEditStatus(goal.status);
    setEditSmart({
      smartSpecific: goal.smartSpecific ?? "",
      smartMeasurable: goal.smartMeasurable ?? "",
      smartAchievable: goal.smartAchievable ?? "",
      smartRelevant: goal.smartRelevant ?? "",
      smartTimeBound: goal.smartTimeBound ?? "",
    });
    setEditing(false);
  }

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) { setAddingTask(false); return; }
    const fd = new FormData();
    fd.set("title", taskTitle.trim());
    fd.set("goalId", String(goal.id));
    fd.set("priority", taskPriority);
    startTransition(async () => {
      try {
        await createTask(fd);
        setTaskTitle("");
        setTaskPriority("medium");
        setAddingTask(false);
      } catch { toast.error("No se pudo crear la tarea"); }
    });
  }

  function handleAddMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!milestoneTitle.trim()) { setAddingMilestone(false); return; }
    const fd = new FormData();
    fd.set("title", milestoneTitle.trim());
    fd.set("goalId", String(goal.id));
    fd.set("position", String(milestones.length));
    startTransition(async () => {
      try {
        await createMilestone(fd);
        setMilestoneTitle("");
        setAddingMilestone(false);
      } catch { toast.error("No se pudo crear el hito"); }
    });
  }

  return (
    <div className={`rounded-xl border transition-colors ${
      goal.status === "completed" ? "border-border/40 opacity-70" : "border-border"
    }`}>
      {/* Header */}
      <div
        className="group flex items-start gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => !editing && setExpanded((v) => !v)}
      >
        <span className="mt-1 text-muted-foreground text-xs shrink-0">{expanded ? "▼" : "▶"}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium text-sm ${STATUS_STYLES[goal.status] ?? "text-foreground/70"}`}>
              {goal.title}
            </span>
            <span className="text-[10px] border border-border/50 px-1.5 py-0.5 rounded font-mono text-foreground/50">
              {STATUS_LABELS[goal.status]}
            </span>
            {goal.horizon && (
              <span className="text-[10px] border border-border/30 px-1.5 py-0.5 rounded font-mono text-foreground/35">
                {HORIZON_LABELS[goal.horizon] ?? goal.horizon}
              </span>
            )}
            {goal.deadline && (
              <span className="flex items-center gap-1 text-[10px] text-foreground/40">
                <Calendar className="w-3 h-3" />
                {formatDate(goal.deadline)}
              </span>
            )}
            {milestones.length > 0 && (
              <span className="text-[10px] text-foreground/35 tabular-nums">
                {completedMilestones}/{milestones.length} hitos
              </span>
            )}
          </div>

          {total > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-foreground/30 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{done}/{total}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setEditing((v) => !v); if (!editing) setExpanded(true); }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground text-xs w-5 h-5 flex items-center justify-center rounded hover:bg-accent transition-colors"
            title="Edit goal"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs w-5 h-5 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors"
            title="Delete goal"
          >
            ×
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border/40 px-4 py-3 space-y-4">
          {/* ── Edit form ── */}
          {editing && (
            <form onSubmit={handleEditSave} onClick={(e) => e.stopPropagation()} className="space-y-3 pb-3 border-b border-border/30">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Título</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:border-ring/60"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Resultado</label>
                <textarea
                  value={editResult}
                  onChange={(e) => setEditResult(e.target.value)}
                  rows={2}
                  placeholder="¿Qué resultado específico querés?"
                  className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:border-ring/60 resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Por qué importa</label>
                <textarea
                  value={editPurpose}
                  onChange={(e) => setEditPurpose(e.target.value)}
                  rows={2}
                  placeholder="¿Por qué es importante esta meta?"
                  className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:border-ring/60 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Horizonte</label>
                  <select
                    value={editHorizon}
                    onChange={(e) => setEditHorizon(e.target.value)}
                    className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:border-ring/60"
                  >
                    <option value="90days">90 Días</option>
                    <option value="1year">1 Año</option>
                    <option value="3year">3 Años</option>
                    <option value="lifetime">Vida</option>
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Estado</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:border-ring/60"
                  >
                    <option value="not_started">Sin iniciar</option>
                    <option value="active">Activa</option>
                    <option value="paused">Pausada</option>
                    <option value="completed">Completada</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Fecha límite</label>
                <input
                  type="date"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:border-ring/60"
                />
              </div>

              {/* SMART fields in edit */}
              <div>
                <button
                  type="button"
                  onClick={() => setSmartOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors"
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${smartOpen ? "" : "-rotate-90"}`} />
                  Campos SMART
                </button>
                {smartOpen && (
                  <div className="mt-2 space-y-2">
                    {SMART_FIELDS.map((f) => (
                      <div key={f.key} className="space-y-0.5">
                        <label className="text-[10px] text-muted-foreground/40">{f.label}</label>
                        <input
                          value={editSmart[f.key]}
                          onChange={(e) => setEditSmart((prev) => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          className="w-full text-xs rounded-lg border border-border/60 bg-background px-2.5 py-1.5 focus:outline-none focus:border-ring/60"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="text-xs px-3 py-1.5 rounded-lg border border-border/60 bg-foreground/5 hover:bg-foreground/10 transition-colors font-medium"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={handleEditCancel}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border/30 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* ── Read-only result/purpose ── */}
          {!editing && (goal.result || goal.purpose) && (
            <div className="space-y-2 text-sm text-muted-foreground">
              {goal.result && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 block mb-0.5">Resultado</span>
                  <p className="leading-relaxed">{goal.result}</p>
                </div>
              )}
              {goal.purpose && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 block mb-0.5">Por qué importa</span>
                  <p className="leading-relaxed">{goal.purpose}</p>
                </div>
              )}
            </div>
          )}

          {/* ── SMART accordion (read-only) ── */}
          {!editing && hasSmart && (
            <div>
              <button
                onClick={() => setSmartOpen((v) => !v)}
                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${smartOpen ? "" : "-rotate-90"}`} />
                Análisis SMART
              </button>
              {smartOpen && (
                <div className="mt-2 space-y-2 pl-1">
                  {SMART_FIELDS.map((f) => {
                    const val = goal[f.key];
                    if (!val) return null;
                    return (
                      <div key={f.key}>
                        <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider">{f.label}: </span>
                        <span className="text-xs text-muted-foreground/70">{val}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Milestones ── */}
          <div className="space-y-1">
            {milestones.length > 0 && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
                Hitos
              </p>
            )}
            {milestones.map((m) => (
              <MilestoneItem key={m.id} milestone={m} />
            ))}
            {addingMilestone ? (
              <form onSubmit={handleAddMilestone} className="mt-1 flex items-center gap-2">
                <input
                  autoFocus
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  placeholder="Hito..."
                  onBlur={() => { if (!milestoneTitle.trim()) setAddingMilestone(false); }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") { setAddingMilestone(false); setMilestoneTitle(""); }
                  }}
                  className="flex-1 text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:border-ring/60"
                />
                <button type="submit" className="text-xs px-2 py-1.5 rounded border border-border/50 text-foreground/60 hover:text-foreground transition-colors">Agregar</button>
                <button type="button" onClick={() => { setAddingMilestone(false); setMilestoneTitle(""); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
              </form>
            ) : (
              <button
                onClick={() => setAddingMilestone(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 py-0.5"
              >
                <span className="text-base leading-none">+</span> Agregar hito
              </button>
            )}
          </div>

          {/* ── Tasks ── */}
          <div className="space-y-1">
            {tasks.length > 0 && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">Tareas</p>
            )}
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
            {addingTask ? (
              <form onSubmit={handleAddTask} className="mt-2 space-y-2">
                <input
                  autoFocus
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Nueva tarea..."
                  className="w-full text-sm rounded-lg border border-border bg-background px-3 py-1.5 focus:outline-none focus:border-ring/60"
                  onBlur={() => { if (!taskTitle.trim()) setAddingTask(false); }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") { setAddingTask(false); setTaskTitle(""); }
                  }}
                />
                <div className="flex items-center gap-2">
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as "high" | "medium" | "low")}
                    className="text-xs rounded-lg border border-border bg-background px-2 py-1 focus:outline-none focus:border-ring/60"
                  >
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </select>
                  <button type="submit" className="text-xs px-2 py-1 rounded border border-border/50 text-foreground/60 hover:text-foreground transition-colors">Agregar</button>
                  <button type="button" onClick={() => { setAddingTask(false); setTaskTitle(""); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setAddingTask(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 py-1"
              >
                <span className="text-base leading-none">+</span> Agregar tarea
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
