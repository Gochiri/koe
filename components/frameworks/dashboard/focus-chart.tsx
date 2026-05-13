"use client";

import { useState } from "react";
import { Clock } from "lucide-react";

interface Props {
  focusByDay: Record<string, number>; // toDateString() → minutes
}

export function FocusChart({ focusByDay }: Props) {
  const entries = Object.entries(focusByDay);
  const maxMinutes = Math.max(...entries.map(([, m]) => m), 1);
  const totalMinutes = entries.reduce((s, [, m]) => s + m, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const [hovered, setHovered] = useState<string | null>(null);

  function dayLabel(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }

  function formatMinutes(m: number): string {
    if (m === 0) return "—";
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h === 0) return `${min}m`;
    if (min === 0) return `${h}h`;
    return `${h}h ${min}m`;
  }

  const allZero = entries.every(([, m]) => m === 0);

  return (
    <div className="rounded-xl border border-border bg-card px-5 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Focus — last 7 days</h3>
            <p className="text-[10px] text-muted-foreground/50">Completed session time</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">{totalHours}h</p>
          <p className="text-[10px] text-muted-foreground/50">this week</p>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end gap-2 h-28 px-1">
        {entries.map(([dateStr, minutes]) => {
          const pct = (minutes / maxMinutes) * 100;
          const isToday = new Date(dateStr).toDateString() === new Date().toDateString();
          const isHovered = hovered === dateStr;
          return (
            <div
              key={dateStr}
              className="flex flex-col items-center gap-1.5 flex-1 cursor-pointer"
              onMouseEnter={() => setHovered(dateStr)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              <div className={`
                text-[10px] font-medium transition-all duration-150
                ${isHovered || isToday ? "opacity-100" : "opacity-0"}
                ${isToday ? "text-blue-400" : "text-muted-foreground"}
              `}>
                {formatMinutes(minutes)}
              </div>

              {/* Bar container */}
              <div className="w-full flex items-end flex-1" style={{ height: "72px" }}>
                <div
                  className={`
                    w-full rounded-t-md transition-all duration-200
                    ${isToday
                      ? "bg-blue-500 shadow-[0_0_12px_2px_rgba(59,130,246,0.25)]"
                      : isHovered
                        ? "bg-blue-400/60"
                        : "bg-blue-500/25"
                    }
                  `}
                  style={{ height: `${Math.max(pct, minutes > 0 ? 6 : 2)}%` }}
                />
              </div>

              {/* Day label */}
              <span className={`
                text-[10px] font-medium transition-colors
                ${isToday ? "text-blue-400 font-semibold" : "text-muted-foreground/50"}
              `}>
                {dayLabel(dateStr)}
              </span>
            </div>
          );
        })}
      </div>

      {allZero && (
        <p className="text-xs text-muted-foreground/40 text-center mt-3">
          No focus sessions this week — start one in Focus
        </p>
      )}
    </div>
  );
}
