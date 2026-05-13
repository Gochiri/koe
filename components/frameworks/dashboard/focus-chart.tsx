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
    return d.toLocaleDateString("es-419", { weekday: "short" }).toUpperCase().slice(0, 2);
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground/40" />
          <div>
            <h3 className="text-sm font-semibold">Enfoque — últimos 7 días</h3>
            <p className="text-[10px] text-muted-foreground/40 mt-0.5">Tiempo de sesiones completadas</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold tabular-nums">{totalHours}h</p>
          <p className="text-[10px] text-muted-foreground/40 mt-0.5">esta semana</p>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end gap-2 h-24 px-1">
        {entries.map(([dateStr, minutes]) => {
          const pct = (minutes / maxMinutes) * 100;
          const isToday = new Date(dateStr).toDateString() === new Date().toDateString();
          const isHovered = hovered === dateStr;
          return (
            <div
              key={dateStr}
              className="flex flex-col items-center gap-1.5 flex-1 cursor-default"
              onMouseEnter={() => setHovered(dateStr)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              <div className={`
                text-[10px] font-medium tabular-nums transition-all duration-100
                ${isHovered || isToday ? "opacity-100" : "opacity-0"}
                ${isToday ? "text-foreground/70" : "text-muted-foreground/60"}
              `}>
                {formatMinutes(minutes)}
              </div>

              {/* Bar container */}
              <div className="w-full flex items-end flex-1" style={{ height: "60px" }}>
                <div
                  className={`
                    w-full rounded-t transition-all duration-200
                    ${isToday
                      ? "bg-foreground/70"
                      : isHovered
                        ? "bg-foreground/35"
                        : "bg-foreground/18"
                    }
                  `}
                  style={{ height: `${Math.max(pct, minutes > 0 ? 8 : 3)}%` }}
                />
              </div>

              {/* Day label */}
              <span className={`
                text-[9px] font-semibold tracking-widest transition-colors
                ${isToday ? "text-foreground/60" : "text-muted-foreground/30"}
              `}>
                {dayLabel(dateStr)}
              </span>
            </div>
          );
        })}
      </div>

      {allZero && (
        <p className="text-[11px] text-muted-foreground/30 text-center mt-4">
          Sin sesiones esta semana — iniciá una en Enfoque
        </p>
      )}
    </div>
  );
}
