"use client";

import { useRef, useState, useTransition } from "react";
import { createContentPiece } from "@/app/(dashboard)/content/actions";
import type { ContentPiece } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const TYPE_LABEL: Record<string, string> = {
  newsletter: "Newsletter",
  x_thread: "Hilo X",
  x_short: "Short X",
  yt_script: "YouTube script",
  yt_short: "YouTube short",
  li_post: "LinkedIn post",
};

export function ContentForm({ newsletters }: { newsletters: ContentPiece[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [type, setType] = useState("newsletter");
  const [parentId, setParentId] = useState<string>("");

  return (
    <Card>
      <CardContent className="pt-6">
        <form
          ref={formRef}
          action={(fd) => {
            start(async () => {
              try {
                await createContentPiece(fd);
                toast.success("Pieza creada");
                formRef.current?.reset();
                setType("newsletter");
                setParentId("");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Error");
              }
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select name="type" value={type} onValueChange={(v) => setType(v ?? "newsletter")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABEL).map(([id, label]) => (
                    <SelectItem key={id} value={id}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" name="title" required placeholder="Título de la pieza" />
            </div>
          </div>

          {type !== "newsletter" && newsletters.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="parentId">Derivar de un newsletter (opcional)</Label>
              <Select name="parentId" value={parentId} onValueChange={(v) => setParentId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Ninguno (pieza standalone)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ninguno</SelectItem>
                  {newsletters.map((n) => (
                    <SelectItem key={n.id} value={String(n.id)}>
                      {n.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="body">Body (opcional)</Label>
            <Textarea id="body" name="body" rows={3} placeholder="Outline / draft / texto final" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publishedUrl">URL publicada (opcional)</Label>
            <Input id="publishedUrl" name="publishedUrl" type="url" placeholder="https://..." />
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Creando..." : "Crear pieza"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
