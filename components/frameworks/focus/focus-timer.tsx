"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { startSession, endSession } from "@/app/(dashboard)/focus/actions";
import { toast } from "sonner";
import { Play, Pause, Square, CheckCircle2, Coffee } from "lucide-react";
import type { Goal, Task } from "@/lib/db/goals-schema";

const PRESETS = [
  { label: "25 min", minutes: 25, breakMinutes: 5 },
  { label: "50 min", minutes: 50, breakMinutes: 10 },
  { label: "90 min", minutes: 90, breakMinutes: 15 },
];

interface Props {
  goals: Goal[];
  tasks: Task[];
}

type TimerState = "idle" | "running" | "paused" | "finished" | "break";

export function FocusTimer({ goals, tasks }: Props) {
  const [presetIdx, setPresetIdx] = useState(0);
  const preset = PRESETS[presetIdx];

  const [secondsLeft, setSecondsLeft] = useState(preset.minutes * 60);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // Break countdown
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(preset.breakMinutes * 60);
  const [breakElapsed, setBreakElapsed] = useState(0);

  const [, startTransition] = useTransition();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Work timer tick
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

  // Break timer tick
  useEffect(() => {
    if (timerState === "break") {
      intervalRef.current = setInterval(() => {
        setBreakSecondsLeft((s) => {
          if (s <= 1) {
            clearTimer();
            setTimerState("idle");
            toast.success("Break over — ready for the next session");
            return 0;
          }
          return s - 1;
        });
        setBreakElapsed((e) => e + 1);
      }, 1000);
    }
    return clearTimer;
  }, [timerState, clearTimer]);

  function handlePreset(idx: number) {
    if (timerState !== "idle") return;
    setPresetIdx(idx);
    setSecondsLeft(PRESETS[idx].minutes * 60);
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
    const currentSessionId = sessionId;
    const elapsed = elapsedSeconds;
    const breakMins = preset.breakMinutes;

    // Reset UI immediately
    setTimerState(completed ? "break" : "idle");
    setSessionId(null);
    setSecondsLeft(preset.minutes * 60);
    setElapsedSeconds(0);
    setBreakSecondsLeft(breakMins * 60);
    setBreakElapsed(0);

    if (!currentSessionId) return;
    const fd = new FormData();
    fd.set("id", String(currentSessionId));
    fd.set("durationMinutes", String(Math.floor(elapsed / 60)));
    fd.set("completed", String(completed));
    if (completed) fd.set("breakMinutes", String(breakMins));
    startTransition(async () => {
      try {
        await endSession(fd);
        if (completed) toast.success("Session complete — take a break");
        else toast.success("Session saved");
      } catch {
        toast.error("Failed to save session");
      }
    });
  }

  function handleSkipBreak() {
    clearTimer();
    setTimerState("idle");
    setBreakSecondsLeft(preset.breakMinutes * 60);
    setBreakElapsed(0);
  }

  const goalTasks = tasks.filter(
    (t) => (!selectedGoalId || t.goalId === Number(selectedGoalId)) && t.status !== "done"
  );

  // Compute ring values
  const isBreak = timerState === "break";
  const displayMinutes = isBreak ? Math.floor(breakSecondsLeft / 60) : Math.floor(secondsLeft / 60);
  const displaySeconds = isBreak ? breakSecondsLeft % 60 : secondsLeft % 60;
  const totalRingSeconds = isBreak ? preset.breakMinutes * 60 : preset.minutes * 60;
  const elapsed = isBreak ? breakElapsed : elapsedSeconds;
  const progressPct = timerState === "idle" ? 0 : Math.min(100, (elapsed / totalRingSeconds) * 100);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-sm font-semibold mb-4">Focus Timer</h2>

      {/* Preset selector */}
      <div className="flex gap-2 mb-6">
        {PRESETS.map((p, idx) => (
          <button
            key={p.minutes}
            onClick={() => handlePreset(idx)}
            disabled={timerState !== "idle"}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              presetIdx === idx
                ? "bg-foreground/10 text-foreground border border-border"
                : "text-muted-foreground hover:bg-accent/60"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Timer display */}
      <div className="flex flex-col items-center gap-4 mb-6">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="45" fill="none" stroke="currentColor"
              strokeWidth="4" className="text-foreground/[0.07]"
            />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke="currentColor" strokeWidth="4"
              className={isBreak ? "text-foreground/25 transition-all duration-1000" : "text-foreground/55 transition-all duration-1000"}
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPct / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tabular-nums">
              {String(displayMinutes).padStart(2, "0")}:{String(displaySeconds).padStart(2, "0")}
            </span>
            {timerState === "finished" && (
              <span className="text-[10px] text-foreground/50 font-medium mt-0.5 tracking-wide uppercase">Done</span>
            )}
            {timerState === "break" && (
              <span className="text-[10px] text-foreground/40 font-medium mt-0.5 tracking-wide uppercase">Break</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {timerState === "idle" && (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-6 py-2 bg-foreground/10 text-foreground border border-border/60 rounded-lg text-sm font-medium hover:bg-foreground/15 transition-colors"
            >
              <Play className="w-3.5 h-3.5" /> Start
            </button>
          )}
          {timerState === "running" && (
            <>
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-4 py-2 bg-foreground/8 text-foreground rounded-lg text-sm font-medium hover:bg-foreground/12 transition-colors"
              >
                <Pause className="w-3.5 h-3.5" /> Pause
              </button>
              <button
                onClick={() => handleStop(false)}
                className="flex items-center gap-2 px-4 py-2 bg-foreground/5 text-muted-foreground rounded-lg text-sm font-medium hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Square className="w-3.5 h-3.5" /> Stop
              </button>
            </>
          )}
          {timerState === "paused" && (
            <>
              <button
                onClick={handleResume}
                className="flex items-center gap-2 px-4 py-2 bg-foreground/10 text-foreground border border-border/60 rounded-lg text-sm font-medium hover:bg-foreground/15 transition-colors"
              >
                <Play className="w-3.5 h-3.5" /> Resume
              </button>
              <button
                onClick={() => handleStop(false)}
                className="flex items-center gap-2 px-4 py-2 bg-foreground/5 text-muted-foreground rounded-lg text-sm font-medium hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Square className="w-3.5 h-3.5" /> Stop
              </button>
            </>
          )}
          {timerState === "finished" && (
            <button
              onClick={() => handleStop(true)}
              className="flex items-center gap-2 px-6 py-2 bg-foreground/10 text-foreground border border-border/60 rounded-lg text-sm font-medium hover:bg-foreground/15 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Complete session
            </button>
          )}
          {timerState === "break" && (
            <button
              onClick={handleSkipBreak}
              className="flex items-center gap-2 px-4 py-2 bg-foreground/5 text-muted-foreground rounded-lg text-sm font-medium hover:bg-foreground/10 transition-colors"
            >
              <Coffee className="w-3.5 h-3.5" /> Skip break
            </button>
          )}
        </div>

        {isBreak && (
          <p className="text-[11px] text-muted-foreground/50 text-center">
            Rest up — {preset.breakMinutes}min break in progress
          </p>
        )}
      </div>

      {/* Goal / Task selector */}
      {timerState === "idle" && (
        <div className="space-y-2">
          <select
            value={selectedGoalId}
            onChange={(e) => { setSelectedGoalId(e.target.value); setSelectedTaskId(""); }}
            className="w-full text-sm bg-background rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-foreground/20 border border-border/60 text-foreground"
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
              className="w-full text-sm bg-background rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-foreground/20 border border-border/60 text-foreground"
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
