"use client";

import { useRef, useTransition } from "react";
import { createTrustEntry } from "@/app/(dashboard)/trust/actions";
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
import { format } from "date-fns";

export function TrustForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <Card>
      <CardContent className="pt-6">
        <form
          ref={formRef}
          action={(fd) => {
            start(async () => {
              try {
                await createTrustEntry(fd);
                toast.success("Pieza categorizada");
                formRef.current?.reset();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Error");
              }
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input id="date" name="date" type="date" defaultValue={today} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bucket">Bucket *</Label>
              <Select name="bucket" defaultValue="growth">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="authority">Authority</SelectItem>
                  <SelectItem value="authenticity">Authenticity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Título de la pieza *</Label>
              <Input id="title" name="title" required placeholder="Ej: Hilo X sobre Koe's Law" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" name="notes" rows={2} placeholder="Cómo performó / link / observaciones" />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Categorizar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
