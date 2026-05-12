"use client";

import { useRef, useState, useTransition } from "react";
import { createCorNote } from "@/app/(dashboard)/notes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const fields: { name: string; label: string; placeholder: string }[] = [
  { name: "problem", label: "Problem", placeholder: "Qué dolor / limitación resuelve esta idea" },
  { name: "goal", label: "Goal", placeholder: "Qué resultado deseado plantea" },
  { name: "example", label: "Example", placeholder: "Un caso concreto" },
  { name: "benefit", label: "Benefit", placeholder: "Por qué importa, qué cambia" },
  { name: "process", label: "Process", placeholder: "Cómo se aplica paso a paso" },
  { name: "concept", label: "Concept", placeholder: "La mental model abstracta detrás" },
];

export function CorForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(true);

  return (
    <Card>
      <CardContent className="pt-6">
        <form
          ref={formRef}
          action={(fd) => {
            startTransition(async () => {
              try {
                await createCorNote(fd);
                toast.success("COR note guardada");
                formRef.current?.reset();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Error al guardar");
              }
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" name="title" required placeholder="Una idea / frase" />
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-xs text-muted-foreground underline"
          >
            {open ? "Ocultar campos detallados" : "Mostrar campos detallados (COR)"}
          </button>

          {open && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map(({ name, label, placeholder }) => (
                <div key={name} className="space-y-2">
                  <Label htmlFor={name}>{label}</Label>
                  <Textarea id={name} name={name} placeholder={placeholder} rows={3} />
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sourceLabel">Fuente (label)</Label>
              <Input id="sourceLabel" name="sourceLabel" placeholder="Libro/Podcast/Video" />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="sourceUrl">Fuente (URL)</Label>
              <Input id="sourceUrl" name="sourceUrl" type="url" placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (coma-separadas)</Label>
              <Input id="tags" name="tags" placeholder="writing, mental-model, ..." />
            </div>
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Guardar COR note"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
