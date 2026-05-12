"use client";

import { useRef, useTransition, useState } from "react";
import { upsertRoutineLog } from "@/app/(dashboard)/routine/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";

export function RoutineForm({ defaultDate }: { defaultDate?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [worked, setWorked] = useState(0);
  const today = defaultDate ?? format(new Date(), "yyyy-MM-dd");

  const overFourHours = worked > 240;

  return (
    <Card>
      <CardContent className="pt-6">
        <form
          ref={formRef}
          action={(fd) => {
            startTransition(async () => {
              try {
                await upsertRoutineLog(fd);
                toast.success("Día guardado");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Error");
              }
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input id="date" name="date" type="date" defaultValue={today} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deepWorkTask">Tarea principal</Label>
              <Input
                id="deepWorkTask"
                name="deepWorkTask"
                placeholder="A qué le dedicaste el bloque de energía"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="energyBlockStart">Bloque inicio</Label>
              <Input id="energyBlockStart" name="energyBlockStart" type="time" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="energyBlockEnd">Bloque fin</Label>
              <Input id="energyBlockEnd" name="energyBlockEnd" type="time" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="walkMinutes">Caminata (min)</Label>
              <Input id="walkMinutes" name="walkMinutes" type="number" min={0} defaultValue={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalWorkedMinutes">Total trabajado (min)</Label>
              <Input
                id="totalWorkedMinutes"
                name="totalWorkedMinutes"
                type="number"
                min={0}
                defaultValue={0}
                onChange={(e) => setWorked(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          {overFourHours && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-amber-100/40 dark:bg-amber-950/30 border border-amber-300/40 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
              <p>
                <strong>Te pasaste de 4h.</strong> Si esto es recurrente, es señal para
                sistematizar, delegar o cortar tareas. La jornada de 4h no es aspiración — es
                forzante.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notas del día</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Qué bloqueó, qué fluyó, observaciones..."
            />
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Guardar día"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
