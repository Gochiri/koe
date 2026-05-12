"use client";

import { useRef, useState, useTransition } from "react";
import { createApagDraft } from "@/app/(dashboard)/writing/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

type Step = {
  name: "attention" | "perspective" | "advantage" | "gamification";
  letter: string;
  label: string;
  prompt: string;
};

const steps: Step[] = [
  {
    name: "attention",
    letter: "A",
    label: "Atención",
    prompt:
      "Ilustrá el problema doloroso del lector. Específico, sensorial, no abstracto. Sin moralina: hacé que se reconozca en una escena concreta.",
  },
  {
    name: "perspective",
    letter: "P",
    label: "Perspectiva",
    prompt:
      "Cambiale el marco mental: por qué su forma actual de ver el problema lo está atrapando. La perspectiva nueva tiene que sentirse obvia en retrospectiva.",
  },
  {
    name: "advantage",
    letter: "A",
    label: "Ventaja (Advantage)",
    prompt:
      "Mostrá el beneficio concreto de adoptar la nueva perspectiva. Resultado tangible, no aspiración vaga. Pintá la escena del 'después'.",
  },
  {
    name: "gamification",
    letter: "G",
    label: "Gamificación",
    prompt:
      "Dale el proceso paso-a-paso. Convertí la transformación en un juego con reglas claras. Termina con CTA específico.",
  },
];

export function ApagForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState({
    attention: "",
    perspective: "",
    advantage: "",
    gamification: "",
  });

  const compiled = [draft.attention, draft.perspective, draft.advantage, draft.gamification]
    .filter((p) => p.trim())
    .join("\n\n");

  return (
    <Card>
      <CardContent className="pt-6">
        <form
          ref={formRef}
          action={(fd) => {
            startTransition(async () => {
              try {
                await createApagDraft(fd);
                toast.success("Draft guardado");
                formRef.current?.reset();
                setDraft({ attention: "", perspective: "", advantage: "", gamification: "" });
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Error");
              }
            });
          }}
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Título / hook *</Label>
            <Input id="title" name="title" required placeholder="Línea de gancho del post" />
          </div>

          {steps.map(({ name, letter, label, prompt }) => (
            <div key={name} className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-lg font-bold w-6">{letter}</span>
                <Label htmlFor={name} className="text-base">{label}</Label>
              </div>
              <p className="text-xs text-muted-foreground ml-8 italic">{prompt}</p>
              <Textarea
                id={name}
                name={name}
                rows={4}
                value={draft[name]}
                onChange={(e) => setDraft((d) => ({ ...d, [name]: e.target.value }))}
                className="ml-8 w-[calc(100%-2rem)]"
              />
            </div>
          ))}

          {compiled && (
            <div className="space-y-2">
              <Label>Preview compilado</Label>
              <pre className="text-xs whitespace-pre-wrap p-4 rounded-md bg-muted/50 border max-h-96 overflow-y-auto leading-relaxed">
                {compiled}
              </pre>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(compiled);
                  toast.success("Copiado al portapapeles");
                }}
              >
                Copiar
              </Button>
            </div>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Guardar como draft"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
