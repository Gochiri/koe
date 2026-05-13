import { type LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent?: string; // kept for API compat, not used visually
}

export function MetricCard({ label, value, sub, icon: Icon }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 hover:border-white/12 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground/45">
          {label}
        </p>
        <Icon className="w-3.5 h-3.5 text-muted-foreground/25" />
      </div>
      <p className="text-[2rem] font-bold tracking-tight tabular-nums leading-none">{value}</p>
      {sub && (
        <p className="text-[11px] text-muted-foreground/45 mt-2">{sub}</p>
      )}
    </div>
  );
}
