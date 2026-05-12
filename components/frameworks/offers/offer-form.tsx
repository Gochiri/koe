"use client";

import { useRef, useState, useTransition } from "react";
import { createOffer } from "@/app/(dashboard)/offers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function OfferForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState({ limitation: "", goal: "", process: "" });

  const pitch = [
    draft.limitation && `Problema: ${draft.limitation.trim()}`,
    draft.goal && `Resultado: ${draft.goal.trim()}`,
    draft.process && `Cómo: ${draft.process.trim()}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    <Card>
      <CardContent className="pt-6">
        <form
          ref={formRef}
          action={(fd) => {
            startTransition(async () => {
              try {
                await createOffer(fd);
                toast.success("Oferta creada");
                formRef.current?.reset();
                setDraft({ limitation: "", goal: "", process: "" });
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Error");
              }
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" name="name" required placeholder='Ej: "MVO Coaching - Newsletter Growth"' />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceUsd">Precio (USD)</Label>
              <Input id="priceUsd" name="priceUsd" type="number" step="0.01" placeholder="1000.00" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="limitation">Problema (limitación dolorosa)</Label>
            <Textarea
              id="limitation"
              name="limitation"
              rows={2}
              value={draft.limitation}
              onChange={(e) => setDraft((d) => ({ ...d, limitation: e.target.value }))}
              placeholder="El dolor específico del cliente"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Meta (resultado tangible)</Label>
            <Textarea
              id="goal"
              name="goal"
              rows={2}
              value={draft.goal}
              onChange={(e) => setDraft((d) => ({ ...d, goal: e.target.value }))}
              placeholder='Ej: "10k MRR en 6 meses"'
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="process">Proceso (tu sistema único)</Label>
            <Textarea
              id="process"
              name="process"
              rows={3}
              value={draft.process}
              onChange={(e) => setDraft((d) => ({ ...d, process: e.target.value }))}
              placeholder="Nombre + secuencia + por qué funciona"
            />
          </div>

          <div className="space-y-2 max-w-xs">
            <Label htmlFor="status">Status inicial</Label>
            <Select name="status" defaultValue="draft">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {pitch && (
            <div className="space-y-2">
              <Label>Pitch compilado</Label>
              <pre className="text-xs whitespace-pre-wrap p-4 rounded-md bg-muted/50 border leading-relaxed">
                {pitch}
              </pre>
            </div>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Crear oferta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
