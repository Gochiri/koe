"use client";

import type { RoutineLog } from "@/lib/db/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteRoutineLog } from "@/app/(dashboard)/routine/actions";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function RoutineList({ logs }: { logs: RoutineLog[] }) {
  if (logs.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Sin registros todavía. Loggeá tu primer día arriba.
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Día</TableHead>
            <TableHead>Bloque</TableHead>
            <TableHead className="text-right">Caminata</TableHead>
            <TableHead className="text-right">Trabajado</TableHead>
            <TableHead>Tarea principal</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const over = log.totalWorkedMinutes > 240;
            return (
              <TableRow key={log.id}>
                <TableCell className="font-medium">
                  {format(parseISO(log.date), "dd MMM yyyy")}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {log.energyBlockStart && log.energyBlockEnd
                    ? `${log.energyBlockStart} → ${log.energyBlockEnd}`
                    : "—"}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {log.walkMinutes > 0 ? `${log.walkMinutes}m` : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <span className={over ? "text-amber-700 dark:text-amber-400 font-medium" : ""}>
                    {formatMinutes(log.totalWorkedMinutes)}
                  </span>
                  {over && (
                    <Badge variant="outline" className="ml-2 text-xs border-amber-400">
                      +4h
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground truncate max-w-[300px]">
                  {log.deepWorkTask || "—"}
                </TableCell>
                <TableCell>
                  <form
                    action={async (fd) => {
                      try {
                        await deleteRoutineLog(fd);
                        toast.success("Registro borrado");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Error");
                      }
                    }}
                  >
                    <input type="hidden" name="id" value={log.id} />
                    <Button
                      variant="ghost"
                      size="icon"
                      type="submit"
                      className="h-7 w-7"
                      title="Eliminar"
                    >
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
  );
}
