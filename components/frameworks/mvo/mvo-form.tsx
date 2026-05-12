"use client";

import { useRef, useTransition } from "react";
import { createMvoEntry } from "@/app/(dashboard)/mvo/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export function MvoForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  return (
    <Card>
      <CardContent className="pt-6">
        <form
          ref={formRef}
          action={(fd) => {
            start(async () => {
              try {
                await createMvoEntry(fd);
                toast.success("Prospect agregado");
                formRef.current?.reset();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Error");
              }
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="prospectName">Prospect *</Label>
              <Input id="prospectName" name="prospectName" required placeholder="Nombre" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prospectContact">Contacto</Label>
              <Input id="prospectContact" name="prospectContact" placeholder="email / IG / Twitter" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priceUsd">Precio (USD)</Label>
              <Input id="priceUsd" name="priceUsd" type="number" step="0.01" defaultValue="500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="callsTotal">Total de calls</Label>
              <Input id="callsTotal" name="callsTotal" type="number" min={1} defaultValue={4} />
            </div>
            <div className="space-y-2 col-span-2 md:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" rows={1} placeholder="Cómo llegó, qué quiere" />
            </div>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Agregar prospect"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
