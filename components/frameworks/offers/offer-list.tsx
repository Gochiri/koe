"use client";

import type { Offer } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteOffer, setOfferStatus } from "@/app/(dashboard)/offers/actions";
import { Trash2, Copy } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTransition } from "react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  live: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  paused: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  retired: "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500",
};

function StatusSelect({ id, current }: { id: number; current: string }) {
  const [pending, start] = useTransition();
  return (
    <Select
      defaultValue={current}
      onValueChange={(v) => {
        if (!v) return;
        start(async () => {
          const fd = new FormData();
          fd.set("id", String(id));
          fd.set("status", v);
          try {
            await setOfferStatus(fd);
            toast.success(`Status: ${v}`);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error");
          }
        });
      }}
      disabled={pending}
    >
      <SelectTrigger className="h-7 w-28 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="draft">Draft</SelectItem>
        <SelectItem value="live">Live</SelectItem>
        <SelectItem value="paused">Paused</SelectItem>
        <SelectItem value="retired">Retired</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function OfferList({ offers }: { offers: Offer[] }) {
  if (offers.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Sin ofertas todavía. Creá la primera arriba.
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">
        Ofertas <span className="text-muted-foreground text-sm">({offers.length})</span>
      </h2>
      {offers.map((o) => (
        <Card key={o.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base">{o.name}</CardTitle>
                  <Badge variant="outline" className={`text-xs ${STATUS_COLORS[o.status]}`}>
                    {o.status}
                  </Badge>
                  {o.priceUsd && (
                    <span className="text-sm text-muted-foreground">
                      ${Number(o.priceUsd).toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(o.createdAt), "dd MMM yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <StatusSelect id={o.id} current={o.status} />
                {o.pitch && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Copiar pitch"
                    onClick={() => {
                      navigator.clipboard.writeText(o.pitch!);
                      toast.success("Pitch copiado");
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                )}
                <form
                  action={async (fd) => {
                    try {
                      await deleteOffer(fd);
                      toast.success("Oferta eliminada");
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Error");
                    }
                  }}
                >
                  <input type="hidden" name="id" value={o.id} />
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
          {o.pitch && (
            <CardContent>
              <pre className="text-xs whitespace-pre-wrap leading-relaxed text-muted-foreground max-h-32 overflow-y-auto">
                {o.pitch}
              </pre>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
