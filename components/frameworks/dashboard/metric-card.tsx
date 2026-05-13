interface Props {
  label: string;
  value: string;
  sub?: string;
  icon?: string;
}

export function MetricCard({ label, value, sub, icon }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-start justify-between mb-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">{label}</p>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
