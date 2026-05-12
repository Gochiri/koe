"use client";

import { useMemo } from "react";
import type { TimeLogEntry } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteTimeLog } from "@/app/(dashboard)/koes-law/actions";
import { Trash2, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { toast } from "sonner";

const ALERT_THRESHOLD = 25; // USD/h

function hourlyRate(hours: number, revenue: number): number {
  if (hours <= 0) return 0;
  return revenue / hours;
}

export function KoesChart({ logs }: { logs: TimeLogEntry[] }) {
  const stats = useMemo(() => {
    const now = new Date();
    const last30 = logs.filter((l) => parseISO(l.date) >= subDays(now, 30));
    const last7 = logs.filter((l) => parseISO(l.date) >= subDays(now, 7));
    const prior7 = logs.filter((l) => {
      const d = parseISO(l.date);
      return d >= subDays(now, 14) && d < subDays(now, 7);
    });

    const sum = (rows: TimeLogEntry[]) =>
      rows.reduce(
        (s, r) => ({
          h: s.h + Number(r.hoursWorked),
          rev: s.rev + Number(r.revenueUsd),
        }),
        { h: 0, rev: 0 }
      );

    const s30 = sum(last30);
    const s7 = sum(last7);
    const sp7 = sum(prior7);

    return {
      hpd30: s30.h / 30,
      rate30: hourlyRate(s30.h, s30.rev),
      rate7: hourlyRate(s7.h, s7.rev),
      ratePrior7: hourlyRate(sp7.h, sp7.rev),
      total30Rev: s30.rev,
      total30H: s30.h,
    };
  }, [logs]);

  // Sparkline: $/hour per day, last 30 days
  const sparkData = useMemo(() => {
    const map = new Map<string, { h: number; rev: number }>();
    logs.forEach((l) => map.set(l.date, { h: Number(l.hoursWorked), rev: Number(l.revenueUsd) }));
    const days: { date: string; rate: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      const v = map.get(d);
      days.push({ date: d, rate: v ? hourlyRate(v.h, v.rev) : 0 });
    }
    return days;
  }, [logs]);

  const maxRate = Math.max(1, ...sparkData.map((d) => d.rate));
  const trend = stats.rate7 - stats.ratePrior7;
  const trendPct = stats.ratePrior7 > 0 ? (trend / stats.ratePrior7) * 100 : 0;
  const lowAlert = stats.rate7 > 0 && stats.rate7 < ALERT_THRESHOLD;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">$/hora (7d)</p>
            <p className="text-2xl font-semibold tabular-nums">
              ${stats.rate7.toFixed(2)}
            </p>
            {stats.ratePrior7 > 0 && (
              <p
                className={`text-xs flex items-center gap-1 mt-1 ${
                  trend >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trendPct >= 0 ? "+" : ""}
                {trendPct.toFixed(0)}% vs semana previa
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">$/hora (30d)</p>
            <p className="text-2xl font-semibold tabular-nums">
              ${stats.rate30.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Promedio horas/día (30d)</p>
            <p className="text-2xl font-semibold tabular-nums">
              {stats.hpd30.toFixed(1)}h
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Revenue 30d</p>
            <p className="text-2xl font-semibold tabular-nums">${stats.total30Rev.toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      {lowAlert && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-amber-100/40 dark:bg-amber-950/30 border border-amber-300/40 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
          <p>
            Tu <strong>$/h (7d) está bajo ${ALERT_THRESHOLD}</strong>. Ley de Koe: cuando la
            métrica cae sostenida, algo del modelo está roto — revisar precio, oferta o tareas
            de bajo apalancamiento.
          </p>
        </div>
      )}

      {/* Sparkline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">$/hora — últimos 30 días</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-end gap-0.5">
            {sparkData.map((d) => (
              <div
                key={d.date}
                title={`${format(parseISO(d.date), "dd MMM")}: $${d.rate.toFixed(2)}/h`}
                className="flex-1 bg-emerald-500/70 hover:bg-emerald-500 rounded-t transition-colors min-h-[2px]"
                style={{ height: `${(d.rate / maxRate) * 100}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{format(parseISO(sparkData[0].date), "dd MMM")}</span>
            <span>hoy</span>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">
          Histórico <span className="text-muted-foreground text-sm">({logs.length})</span>
        </h2>
        {logs.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Loggeá tu primer día arriba.
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Día</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">$/hora</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => {
                  const rate = hourlyRate(Number(l.hoursWorked), Number(l.revenueUsd));
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">
                        {format(parseISO(l.date), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(l.hoursWorked).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        ${Number(l.revenueUsd).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        ${rate.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {l.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <form
                          action={async (fd) => {
                            try {
                              await deleteTimeLog(fd);
                              toast.success("Eliminado");
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Error");
                            }
                          }}
                        >
                          <input type="hidden" name="id" value={l.id} />
                          <Button variant="ghost" size="icon" type="submit" className="h-7 w-7">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
