import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent?: "blue" | "emerald" | "violet" | "amber";
}

const accentMap = {
  blue:    { bg: "bg-blue-500/10",    icon: "text-blue-400",    border: "border-blue-500/20",    bar: "bg-blue-500" },
  emerald: { bg: "bg-emerald-500/10", icon: "text-emerald-400", border: "border-emerald-500/20", bar: "bg-emerald-500" },
  violet:  { bg: "bg-violet-500/10",  icon: "text-violet-400",  border: "border-violet-500/20",  bar: "bg-violet-500" },
  amber:   { bg: "bg-amber-500/10",   icon: "text-amber-400",   border: "border-amber-500/20",   bar: "bg-amber-500" },
};

export function MetricCard({ label, value, sub, icon: Icon, accent = "blue" }: Props) {
  const colors = accentMap[accent];
  return (
    <div className="relative rounded-xl border border-border bg-card px-4 py-4 overflow-hidden group hover:border-white/10 transition-colors">
      {/* Top accent bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-0.5", colors.bar, "opacity-60")} />

      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          {label}
        </p>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colors.bg, "border", colors.border)}>
          <Icon className={cn("w-3.5 h-3.5", colors.icon)} />
        </div>
      </div>

      <p className="text-3xl font-bold tracking-tight">{value}</p>
      {sub && (
        <p className="text-xs text-muted-foreground/60 mt-1">{sub}</p>
      )}
    </div>
  );
}
