"use client";

import { useState, useEffect, useTransition } from "react";
import type { VaultNodeDir } from "@/lib/obsidian/vault";
import { VaultTree } from "./vault-tree";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, FileText, ArrowDownToLine } from "lucide-react";
import { fetchVaultFile } from "@/app/(dashboard)/vault/actions";
import { importVaultFileAsCorNote } from "@/app/(dashboard)/notes/actions";
import { format } from "date-fns";
import { toast } from "sonner";

export function VaultReader({ tree }: { tree: VaultNodeDir }) {
  const [activePath, setActivePath] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [meta, setMeta] = useState<{ mtime: number; size: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [, startImport] = useTransition();

  useEffect(() => {
    if (!activePath) {
      setContent("");
      setMeta(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchVaultFile(activePath)
      .then((res) => {
        if (cancelled || !res) return;
        setContent(res.content);
        setMeta({ mtime: res.mtime, size: res.size });
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Error"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [activePath]);

  const title = activePath
    ? activePath.split("/").pop()?.replace(/\.md$/i, "") ?? activePath
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-3 h-[calc(100vh-200px)] min-h-[500px]">
      <Card className="overflow-hidden p-0">
        <VaultTree
          tree={tree}
          activePath={activePath}
          onSelect={setActivePath}
        />
      </Card>

      <Card className="overflow-hidden flex flex-col">
        {activePath ? (
          <>
            <div className="border-b p-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-base font-semibold truncate">{title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {activePath}
                  {meta && ` · ${format(new Date(meta.mtime), "dd MMM yyyy HH:mm")}`}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(content);
                    toast.success("Copiado");
                  }}
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copiar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (!activePath) return;
                    startImport(async () => {
                      try {
                        await importVaultFileAsCorNote(activePath);
                        toast.success("Importado a Ideas");
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Error");
                      }
                    });
                  }}
                >
                  <ArrowDownToLine className="w-3.5 h-3.5 mr-1.5" />
                  Importar a Ideas
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : (
                <pre className="text-sm whitespace-pre-wrap leading-relaxed font-sans">
                  {content || "(archivo vacío)"}
                </pre>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-sm text-muted-foreground gap-2 p-8">
            <FileText className="w-8 h-8 opacity-40" />
            <p>Elegí un archivo del árbol para leerlo.</p>
            <p className="text-xs">
              <Badge variant="outline">{tree.children.length} carpetas/archivos en la raíz</Badge>
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
