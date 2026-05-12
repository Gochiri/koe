"use client";

import type { ApagDraft } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  markApagPublished,
  deleteApagDraft,
} from "@/app/(dashboard)/writing/actions";
import { Trash2, Check, Copy } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export function ApagList({ drafts }: { drafts: ApagDraft[] }) {
  if (drafts.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Sin drafts todavía. Escribí tu primer post APAG arriba.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">
        Drafts <span className="text-muted-foreground text-sm">({drafts.length})</span>
      </h2>
      {drafts.map((d) => (
        <Card key={d.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{d.title}</CardTitle>
                  {d.publishedAt && (
                    <Badge variant="default" className="text-xs">
                      Publicado
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(d.createdAt), "dd MMM yyyy · HH:mm")}
                  {d.publishedAt
                    ? ` · publicado ${format(new Date(d.publishedAt), "dd MMM")}`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {d.finalOutput && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Copiar al portapapeles"
                    onClick={() => {
                      navigator.clipboard.writeText(d.finalOutput!);
                      toast.success("Copiado");
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                )}
                {!d.publishedAt && (
                  <form
                    action={async (fd) => {
                      try {
                        await markApagPublished(fd);
                        toast.success("Marcado como publicado");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Error");
                      }
                    }}
                  >
                    <input type="hidden" name="id" value={d.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Marcar publicado"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                  </form>
                )}
                <form
                  action={async (fd) => {
                    try {
                      await deleteApagDraft(fd);
                      toast.success("Eliminado");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Error");
                    }
                  }}
                >
                  <input type="hidden" name="id" value={d.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </div>
            </div>
          </CardHeader>
          {d.finalOutput && (
            <CardContent>
              <pre className="text-xs whitespace-pre-wrap leading-relaxed text-muted-foreground max-h-48 overflow-y-auto">
                {d.finalOutput}
              </pre>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
