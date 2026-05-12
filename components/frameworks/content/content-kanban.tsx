"use client";

import { useTransition } from "react";
import type { ContentPiece } from "@/lib/db/schema";
import { Card } from "@/components/ui/card";
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
  setContentStatus,
  deleteContentPiece,
} from "@/app/(dashboard)/content/actions";
import { Trash2, ExternalLink, Link2 } from "lucide-react";
import { toast } from "sonner";

const STATUSES = [
  { id: "idea", label: "Idea" },
  { id: "draft", label: "Draft" },
  { id: "scheduled", label: "Scheduled" },
  { id: "published", label: "Published" },
] as const;

const TYPE_LABEL: Record<string, string> = {
  newsletter: "Newsletter",
  x_thread: "X thread",
  x_short: "X short",
  yt_script: "YT script",
  yt_short: "YT short",
  li_post: "LinkedIn",
};

const TYPE_COLOR: Record<string, string> = {
  newsletter: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  x_thread: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  x_short: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400",
  yt_script: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  yt_short: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  li_post: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
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
            await setContentStatus(fd);
            toast.success(`Movido a: ${v}`);
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
        {STATUSES.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ContentKanban({ pieces }: { pieces: ContentPiece[] }) {
  if (pieces.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Empezá creando un newsletter. Después podés derivar piezas hijas.
      </Card>
    );
  }
  const grouped = STATUSES.map((s) => ({
    ...s,
    pieces: pieces.filter((p) => p.status === s.id),
  }));
  const parentTitles = new Map(pieces.map((p) => [p.id, p.title]));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Pipeline</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {grouped.map((col) => (
          <div key={col.id} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{col.label}</span>
              <Badge variant="secondary" className="text-xs">
                {col.pieces.length}
              </Badge>
            </div>
            <div className="space-y-2 min-h-[60px]">
              {col.pieces.map((p) => (
                <Card key={p.id} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Badge variant="outline" className={`text-xs ${TYPE_COLOR[p.type]}`}>
                          {TYPE_LABEL[p.type]}
                        </Badge>
                        <p className="text-sm font-medium mt-1 break-words">{p.title}</p>
                        {p.parentId && parentTitles.has(p.parentId) && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Link2 className="w-3 h-3" />
                            <span className="truncate">de: {parentTitles.get(p.parentId)}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5">
                        {p.publishedUrl && (
                          <a
                            href={p.publishedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-muted"
                            title="Abrir"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <form
                          action={async (fd) => {
                            try {
                              await deleteContentPiece(fd);
                              toast.success("Eliminado");
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : "Error");
                            }
                          }}
                        >
                          <input type="hidden" name="id" value={p.id} />
                          <Button variant="ghost" size="icon" type="submit" className="h-6 w-6">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </form>
                      </div>
                    </div>
                    <StatusSelect id={p.id} current={p.status} />
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
