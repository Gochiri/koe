"use client";

interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

interface Props {
  achievements: Achievement[];
}

export function Achievements({ achievements }: Props) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/35">
          Logros
        </p>
        <span className="text-[11px] tabular-nums text-muted-foreground/50">
          {unlockedCount}/{achievements.length}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {achievements.map((a) => (
          <div
            key={a.id}
            title={a.description}
            className={`rounded-lg border px-2 py-2 text-center transition-opacity ${
              a.unlocked
                ? "border-border/60 bg-foreground/5"
                : "border-border/25 opacity-30"
            }`}
          >
            <p className={`text-[11px] font-medium leading-tight ${
              a.unlocked ? "text-foreground/70" : "text-foreground/40"
            }`}>
              {a.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
