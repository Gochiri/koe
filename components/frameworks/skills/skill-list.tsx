"use client";

import { useTransition } from "react";
import type { Skill } from "@/lib/db/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteSkill, setSkillPhase } from "@/app/(dashboard)/skills/actions";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

const PHASE_COLOR: Record<string, string> = {
  build: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  teach: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  earn: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

function PhaseSelect({ id, current }: { id: number; current: string }) {
  const [pending, start] = useTransition();
  return (
    <Select
      defaultValue={current}
      onValueChange={(v) => {
        if (!v) return;
        start(async () => {
          const fd = new FormData();
          fd.set("id", String(id));
          fd.set("phase", v);
          try {
            await setSkillPhase(fd);
            toast.success(`Fase: ${v}`);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error");
          }
        });
      }}
      disabled={pending}
    >
      <SelectTrigger className="h-7 w-24 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="build">Build</SelectItem>
        <SelectItem value="teach">Teach</SelectItem>
        <SelectItem value="earn">Earn</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function SkillList({ skills }: { skills: Skill[] }) {
  if (skills.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Agregá tu primera skill arriba.
      </Card>
    );
  }
  const totalRevenue = skills.reduce((s, x) => s + Number(x.revenueUsd ?? 0), 0);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">
          Skills <span className="text-muted-foreground text-sm">({skills.length})</span>
        </h2>
        <span className="text-sm text-muted-foreground">
          Revenue total: <span className="font-medium text-foreground">${totalRevenue.toFixed(2)}</span>
        </span>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Skill</TableHead>
              <TableHead>Fase</TableHead>
              <TableHead>Proyecto</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skills.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${PHASE_COLOR[s.phase]}`}>
                      {s.phase}
                    </Badge>
                    <PhaseSelect id={s.id} current={s.phase} />
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate">
                  {s.project || "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  ${Number(s.revenueUsd ?? 0).toFixed(2)}
                </TableCell>
                <TableCell>
                  <form
                    action={async (fd) => {
                      try {
                        await deleteSkill(fd);
                        toast.success("Skill eliminada");
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Error");
                      }
                    }}
                  >
                    <input type="hidden" name="id" value={s.id} />
                    <Button variant="ghost" size="icon" type="submit" className="h-7 w-7">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
