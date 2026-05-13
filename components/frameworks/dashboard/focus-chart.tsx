"use client";

interface Props {
  focusByDay: Record<string, number>; // toDateString() → minutes
}

export function FocusChart({ focusByDay }: Props) {
  const entries = Object.entries(focusByDay);
  const maxMinutes = Math.max(...entries.map(([, m]) => m), 1);

  function dayLabel(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-AR", { weekday: "short" });
  }

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <h3 className="text-sm font-semibold mb-4">Focus — últimos 7 días</h3>
      <div className="flex items-end gap-2 h-20">
        {entries.map(([dateStr, minutes]) => {
          const pct = (minutes / maxMinutes) * 100;
          const isToday = new Date(dateStr).toDateString() === new Date().toDateString();
          return (
            <div key={dateStr} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[10px] text-muted-foreground">{minutes > 0 ? `${minutes}m` : ""}</span>
              <div className="w-full flex items-end" style={{ height: "48px" }}>
                <div
                  className={`w-full rounded-t-sm transition-all ${isToday ? "bg-primary" : "bg-primary/40"}`}
                  style={{ height: `${Math.max(pct, minutes > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span className={`text-[10px] ${isToday ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                {dayLabel(dateStr)}
              </span>
            </div>
          );
        })}
      </div>
      {entries.every(([, m]) => m === 0) && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Sin sesiones de focus esta semana
        </p>
      )}
    </div>
  );
}
