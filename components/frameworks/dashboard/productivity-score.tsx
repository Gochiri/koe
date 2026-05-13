"use client";

interface Props {
  score: number;
  previousScore: number;
}

export function ProductivityScore({ score, previousScore }: Props) {
  const diff = score - previousScore;
  const diffLabel = diff === 0 ? "igual que la semana pasada" : diff > 0 ? `+${diff} vs semana pasada` : `${diff} vs semana pasada`;

  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/35 mb-3">
        Puntuación de productividad
      </p>
      <div className="flex items-end gap-3 mb-3">
        <span className="text-5xl font-bold tabular-nums leading-none tracking-tight">{score}</span>
        <span className="text-sm text-muted-foreground/50 mb-1">/ 100</span>
      </div>

      {/* Score bar */}
      <div className="h-1.5 bg-foreground/[0.07] rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-foreground/45 rounded-full transition-all duration-700"
          style={{ width: `${score}%` }}
        />
      </div>

      <p className="text-[11px] text-muted-foreground/50 tabular-nums">{diffLabel}</p>
    </div>
  );
}
