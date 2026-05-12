"use client";

import type { TrustEntry } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteTrustEntry } from "@/app/(dashboard)/trust/actions";
import { Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { toast } from "sonner";

const BUCKET_LABEL: Record<string, string> = {
  growth: "Growth",
  authority: "Authority",
  authenticity: "Authenticity",
};

const BUCKET_COLOR: Record<string, string> = {
  growth:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300/40",
  authority:
    "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border-violet-300/40",
  authenticity:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300/40",
};

export function TrustBalance({ entries }: { entries: TrustEntry[] }) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const thisWeek = entries.filter((e) =>
    isWithinInterval(parseISO(e.date), { start: weekStart, end: weekEnd })
  );

  const counts = {
    growth: thisWeek.filter((e) => e.bucket === "growth").length,
    authority: thisWeek.filter((e) => e.bucket === "authority").length,
    authenticity: thisWeek.filter((e) => e.bucket === "authenticity").length,
  };
  const total = counts.growth + counts.authority + counts.authenticity;

  // Balance: any bucket >= 75% of total = warning
  const warnings: string[] = [];
  if (total >= 3) {
    if (counts.growth / total >= 0.75) warnings.push("Growth domina (>75%) — falta autoridad/profundidad");
    if (counts.authority / total >= 0.75) warnings.push("Authority domina — falta alcance");
    if (counts.authenticity / total >= 0.75) warnings.push("Authenticity domina — falta crecimiento");
  }

  return (
    <div className="space-y-6">
      {/* Weekly balance card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Balance — semana del {format(weekStart, "dd MMM")} al {format(weekEnd, "dd MMM")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {(["growth", "authority", "authenticity"] as const).map((b) => {
              const pct = total > 0 ? Math.round((counts[b] / total) * 100) : 0;
              return (
                <div key={b} className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium">{BUCKET_LABEL[b]}</span>
                    <span className="text-2xl font-semibold tabular-nums">{counts[b]}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        b === "growth"
                          ? "bg-emerald-500"
                          : b === "authority"
                            ? "bg-violet-500"
                            : "bg-amber-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{pct}%</p>
                </div>
              );
            })}
          </div>

          {warnings.length > 0 ? (
            warnings.map((w) => (
              <div
                key={w}
                className="flex items-start gap-2 p-2.5 rounded-md bg-amber-100/40 dark:bg-amber-950/30 border border-amber-300/40 text-xs"
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
                <p>{w}</p>
              </div>
            ))
          ) : total >= 3 ? (
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-emerald-100/40 dark:bg-emerald-950/30 border border-emerald-300/40 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p>Balance saludable esta semana.</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {total === 0
                ? "Sin piezas categorizadas esta semana."
                : `Sólo ${total} pieza${total === 1 ? "" : "s"} esta semana — categorizá más para ver balance.`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">
          Historial <span className="text-muted-foreground text-sm">({entries.length})</span>
        </h2>
        {entries.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Categorizá tu primera pieza arriba.
          </Card>
        ) : (
          <Card>
            <div className="divide-y">
              {entries.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-xs ${BUCKET_COLOR[e.bucket]}`}>
                        {BUCKET_LABEL[e.bucket]}
                      </Badge>
                      <span className="text-sm font-medium truncate">{e.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(parseISO(e.date), "dd MMM yyyy")}
                      {e.notes ? ` · ${e.notes}` : ""}
                    </p>
                  </div>
                  <form
                    action={async (fd) => {
                      try {
                        await deleteTrustEntry(fd);
                        toast.success("Eliminado");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Error");
                      }
                    }}
                  >
                    <input type="hidden" name="id" value={e.id} />
                    <Button variant="ghost" size="icon" type="submit" className="h-7 w-7">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
