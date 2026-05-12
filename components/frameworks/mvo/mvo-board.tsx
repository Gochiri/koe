"use client";

import { useTransition } from "react";
import type { MvoEntry } from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  moveMvoStage,
  incMvoCalls,
  deleteMvoEntry,
} from "@/app/(dashboard)/mvo/actions";
import { Trash2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

const STAGES = [
  { id: "prospect", label: "Prospect" },
  { id: "call_scheduled", label: "Call agendada" },
  { id: "sold", label: "Vendido" },
  { id: "delivering", label: "Entregando" },
  { id: "done", label: "Done" },
  { id: "lost", label: "Lost" },
] as const;

function StageSelect({ id, current }: { id: number; current: string }) {
  const [pending, start] = useTransition();
  return (
    <Select
      defaultValue={current}
      onValueChange={(v) => {
        if (!v) return;
        start(async () => {
          const fd = new FormData();
          fd.set("id", String(id));
          fd.set("stage", v);
          try {
            await moveMvoStage(fd);
            toast.success(`Movido a: ${v}`);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error");
          }
        });
      }}
      disabled={pending}
    >
      <SelectTrigger className="h-7 w-32 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STAGES.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CallCounter({
  id,
  done,
  total,
}: {
  id: number;
  done: number;
  total: number;
}) {
  const [pending, start] = useTransition();
  const dispatch = (delta: number) => {
    start(async () => {
      const fd = new FormData();
      fd.set("id", String(id));
      fd.set("delta", String(delta));
      try {
        await incMvoCalls(fd);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  };
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        disabled={pending || done <= 0}
        onClick={() => dispatch(-1)}
      >
        <Minus className="w-3 h-3" />
      </Button>
      <span className="text-xs tabular-nums font-medium min-w-[2.5rem] text-center">
        {done} / {total}
      </span>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        disabled={pending || done >= total}
        onClick={() => dispatch(1)}
      >
        <Plus className="w-3 h-3" />
      </Button>
    </div>
  );
}

export function MvoBoard({ entries }: { entries: MvoEntry[] }) {
  if (entries.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Sin prospects todavía. Agregá el primero arriba.
      </Card>
    );
  }
  const grouped = STAGES.map((s) => ({
    ...s,
    entries: entries.filter((e) => e.stage === s.id),
  }));

  const activeRevenue = entries
    .filter((e) => ["sold", "delivering", "done"].includes(e.stage))
    .reduce((sum, e) => sum + Number(e.priceUsd ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Pipeline</h2>
        <span className="text-sm text-muted-foreground">
          Revenue cerrado: <span className="font-medium text-foreground">${activeRevenue.toFixed(2)}</span>
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {grouped.map((col) => (
          <div key={col.id} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{col.label}</span>
              <Badge variant="secondary" className="text-xs">
                {col.entries.length}
              </Badge>
            </div>
            <div className="space-y-2 min-h-[60px]">
              {col.entries.map((e) => (
                <Card key={e.id} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{e.prospectName}</p>
                        {e.prospectContact && (
                          <p className="text-xs text-muted-foreground truncate">
                            {e.prospectContact}
                          </p>
                        )}
                      </div>
                      <form
                        action={async (fd) => {
                          try {
                            await deleteMvoEntry(fd);
                            toast.success("Eliminado");
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Error");
                          }
                        }}
                      >
                        <input type="hidden" name="id" value={e.id} />
                        <Button variant="ghost" size="icon" type="submit" className="h-6 w-6">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </form>
                    </div>
                    <div className="flex items-center justify-between">
                      <CallCounter id={e.id} done={e.callsDone} total={e.callsTotal} />
                      {e.priceUsd && (
                        <span className="text-xs font-medium tabular-nums">
                          ${Number(e.priceUsd).toFixed(0)}
                        </span>
                      )}
                    </div>
                    <StageSelect id={e.id} current={e.stage} />
                    {e.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {e.notes}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
