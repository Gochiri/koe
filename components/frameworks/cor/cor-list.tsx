"use client";

import { useState, useMemo } from "react";
import type { CorNote } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteCorNote } from "@/app/(dashboard)/notes/actions";
import { Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const corFields: { key: keyof CorNote; label: string }[] = [
  { key: "problem", label: "Problem" },
  { key: "goal", label: "Goal" },
  { key: "example", label: "Example" },
  { key: "benefit", label: "Benefit" },
  { key: "process", label: "Process" },
  { key: "concept", label: "Concept" },
];

export function CorList({ notes }: { notes: CorNote[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return notes;
    return notes.filter((n) => {
      const hay = [
        n.title,
        n.problem,
        n.goal,
        n.example,
        n.benefit,
        n.process,
        n.concept,
        n.sourceLabel,
        (n.tags ?? []).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [notes, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">
          Historial <span className="text-muted-foreground text-sm">({notes.length})</span>
        </h2>
        <Input
          placeholder="Buscar..."
          className="max-w-xs"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground p-8 text-center border rounded-md">
          {q ? "Sin resultados" : "Todavía no guardaste ninguna COR note."}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <Card key={n.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base">{n.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(n.createdAt), "dd MMM yyyy · HH:mm")}
                      {n.sourceLabel ? ` · ${n.sourceLabel}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {n.sourceUrl && (
                      <a
                        href={n.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded hover:bg-muted"
                        title="Abrir fuente"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <form
                      action={async (fd) => {
                        try {
                          await deleteCorNote(fd);
                          toast.success("Note eliminada");
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Error");
                        }
                      }}
                    >
                      <input type="hidden" name="id" value={n.id} />
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
                  </div>
                </div>
                {n.tags && n.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {n.tags.map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {corFields.map(({ key, label }) => {
                    const val = n[key] as string | null | undefined;
                    if (!val) return null;
                    return (
                      <div key={key}>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {label}
                        </div>
                        <p className="mt-0.5 whitespace-pre-wrap leading-relaxed">{val}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
