"use client";

import { useRef, useTransition } from "react";
import type { OnePersonVision } from "@/lib/db/schema";
import { upsertVision } from "@/app/(dashboard)/one-person/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";

const fields: {
  name: keyof Pick<OnePersonVision, "identity" | "problemISolve" | "idealCustomer" | "productizedSelf">;
  label: string;
  prompt: string;
  type: "input" | "textarea";
}[] = [
  {
    name: "identity",
    label: "Identidad pública",
    prompt: "Soy un ___ que ayuda a ___ a ___. (1 línea)",
    type: "input",
  },
  {
    name: "problemISolve",
    label: "Problema que resuelvo",
    prompt: "El dolor específico que tu cliente ideal está viviendo hoy. Más concreto que abstracto.",
    type: "textarea",
  },
  {
    name: "idealCustomer",
    label: "Cliente ideal",
    prompt: "¿Quién es exactamente? Edad, situación, qué hace, qué intentó antes, dónde se rinde.",
    type: "textarea",
  },
  {
    name: "productizedSelf",
    label: "Cómo está empaquetada la solución hoy",
    prompt: "Servicio, curso, comunidad, producto digital. La forma actual — va a evolucionar.",
    type: "textarea",
  },
];

export function VisionForm({ vision }: { vision: OnePersonVision | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="pt-6">
        <form
          ref={formRef}
          action={(fd) => {
            startTransition(async () => {
              try {
                await upsertVision(fd);
                toast.success("Manifesto guardado");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Error");
              }
            });
          }}
          className="space-y-5"
        >
          {fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={f.name}>{f.label}</Label>
              <p className="text-xs text-muted-foreground italic">{f.prompt}</p>
              {f.type === "input" ? (
                <Input id={f.name} name={f.name} defaultValue={vision?.[f.name] ?? ""} />
              ) : (
                <Textarea
                  id={f.name}
                  name={f.name}
                  rows={3}
                  defaultValue={vision?.[f.name] ?? ""}
                />
              )}
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {vision?.updatedAt
                ? `Última actualización: ${format(new Date(vision.updatedAt), "dd MMM yyyy")}`
                : "Sin guardar todavía"}
            </p>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar manifesto"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
