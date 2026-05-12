"use client";

import { useRef, useTransition } from "react";
import { upsertTimeLog } from "@/app/(dashboard)/koes-law/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";

export function KoesForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const today = format(new Date(), "yyyy-MM-dd");
  return (
    <Card>
      <CardContent className="pt-6">
        <form
          ref={formRef}
          action={(fd) => {
            start(async () => {
              try {
                await upsertTimeLog(fd);
                toast.success("Día guardado");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Error");
              }
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input id="date" name="date" type="date" defaultValue={today} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hoursWorked">Horas trabajadas *</Label>
              <Input
                id="hoursWorked"
                name="hoursWorked"
                type="number"
                step="0.25"
                min={0}
                max={24}
                required
                defaultValue="4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="revenueUsd">Revenue del día (USD)</Label>
              <Input
                id="revenueUsd"
                name="revenueUsd"
                type="number"
                step="0.01"
                min={0}
                defaultValue="0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" name="notes" rows={2} placeholder="A qué fueron las horas / fuente del revenue" />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Guardar día"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
