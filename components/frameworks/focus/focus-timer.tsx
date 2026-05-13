"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { startSession, endSession } from "@/app/(dashboard)/focus/actions";
import { toast } from "sonner";
import { Play, Pause, Square, CheckCircle2 } from "lucide-react";
import type { Goal, Task } from "@/lib/db/goals-schema";

const PRESETS = [
  { label: "25 min", minutes: 25 },
  { label: "50 min", minutes: 50 },
  { label: "90 min", minutes: 90 },
];

interface Props {
  goals: Goal[];
  tasks: Task[];
}

type TimerState = "idle" | "running" | "paused" | "finished";

export function FocusTimer({ goals, tasks }: Props) {
  const [preset, setPreset] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [, startTransition] = useTransition();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (timerState === "running") {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearTimer();
            setTimerState("finished");
            return 0;
          }
          return s - 1;
        });
        setElapsedSeconds((e) => e + 1);
      }, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [timerState, clearTimer]);

  function handlePreset(minutes: number) {
    if (timerState !== "idle") return;
    setPreset(minutes);
    setSecondsLeft(minutes * 60);
  }

  function handleStart() {
    const fd = new FormData();
    if (selectedGoalId) fd.set("goalId", selectedGoalId);
    if (selectedTaskId) fd.set("taskId", selectedTaskId);
    startTransition(async () => {
      try {
        const id = await startSession(fd);
        setSessionId(id);
        setTimerState("running");
        setElapsedSeconds(0);
      } catch {
        toast.error("Failed to start session");
      }
    });
  }

  function handlePause() {
    setTimerState("paused");
  }

  function handleResume() {
    setTimerState("running");
  }

  function handleStop(completed: boolean) {
    clearTimer();
    setTimerState("idle");
    if (!sessionId) return;
    const fd = new FormData();
    fd.set("id", String(sessionId));
    fd.set("durationMinutes", String(Math.floor(elapsedSeconds / 60)));
    fd.set("completed", String(completed));
    startTransition(async () => {
      try {
        await endSession(fd);
        toast.success(completed ? "¡Sesión completada! 🎉" : "Sesión guardada");
      } catch {
        toast.error("Failed to save session");
      } finally {
        setSessionId(null);
        setSecondsLeft(preset * 60);
        setElapsedSeconds(0);
      }
    });
  }

  const goalTasks = tasks.filter(
    (t) => (!selectedGoalId || t.goalId === Number(selectedGoalId)) && t.status !== "done"
  );

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const totalSeconds = preset * 60;
  const progressPct = timerState === "idle" ? 0 : ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-sm font-semibold mb-4">Focus Timer</h2>

      {/* Preset selector */}
      <div className="flex gap-2 mb-6">
        {PRESETS.map((p) => (
          <button
            key={p.minutes}
            onClick={() => handlePreset(p.minutes)}
            disabled={timerState !== "idle"}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              preset === p.minutes
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Timer display */}
      <div className="flex flex-col items-center gap-4 mb-6">
        {/* Ring */}
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/30" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke="currentColor" strokeWidth="4"
              className="text-primary transition-all duration-1000"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPct / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            {timerState === "finished" && (
              <span className="text-xs text-emerald-400 font-medium mt-0.5">Done!</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {timerState === "idle" && (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Play className="w-3.5 h-3.5" /> Start
            </button>
          )}
          {timerState === "running" && (
            <>
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors"
              >
                <Pause className="w-3.5 h-3.5" /> Pause
              </button>
              <button
                onClick={() => handleStop(false)}
                className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Square className="w-3.5 h-3.5" /> Stop
              </button>
            </>
          )}
          {timerState === "paused" && (
            <>
              <button
                onClick={handleResume}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Play className="w-3.5 h-3.5" /> Resume
              </button>
              <button
                onClick={() => handleStop(false)}
                className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Square className="w-3.5 h-3.5" /> Stop
              </button>
            </>
          )}
          {timerState === "finished" && (
            <button
              onClick={() => handleStop(true)}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Complete session
            </button>
          )}
        </div>
      </div>

      {/* Goal / Task selector */}
      {timerState === "idle" && (
        <div className="space-y-2">
          <select
            value={selectedGoalId}
            onChange={(e) => { setSelectedGoalId(e.target.value); setSelectedTaskId(""); }}
            className="w-full text-sm bg-background rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 border border-border/60 text-foreground"
          >
            <option value="">No linked goal</option>
            {goals.map((g) => (
              <option key={g.id} value={String(g.id)}>{g.title}</option>
            ))}
          </select>

          {selectedGoalId && goalTasks.length > 0 && (
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full text-sm bg-background rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 border border-border/60 text-foreground"
            >
              <option value="">No specific task</option>
              {goalTasks.map((t) => (
                <option key={t.id} value={String(t.id)}>{t.title}</option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}
