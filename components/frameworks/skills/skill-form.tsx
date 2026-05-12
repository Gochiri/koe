"use client";

import { useRef, useTransition } from "react";
import { createSkill } from "@/app/(dashboard)/skills/actions";
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

export function SkillForm() {
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
                await createSkill(fd);
                toast.success("Skill agregada");
                formRef.current?.reset();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Error");
              }
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Skill *</Label>
              <Input id="name" name="name" required placeholder="Ej: Copywriting, Design, n8n" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phase">Fase actual</Label>
              <Select name="phase" defaultValue="build">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="build">Build</SelectItem>
                  <SelectItem value="teach">Teach</SelectItem>
                  <SelectItem value="earn">Earn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="project">Proyecto donde la aplicás</Label>
              <Input id="project" name="project" placeholder="Ej: este dashboard / tu newsletter" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startedAt">Empezó</Label>
              <Input id="startedAt" name="startedAt" type="date" defaultValue={today} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas / links a content publicado</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Posts donde enseñás, obstáculos, qué probaste"
            />
          </div>
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="revenueUsd">Revenue acumulado (USD)</Label>
            <Input
              id="revenueUsd"
              name="revenueUsd"
              type="number"
              step="0.01"
              defaultValue="0"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Agregar skill"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
