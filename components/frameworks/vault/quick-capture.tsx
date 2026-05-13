"use client";

import { useRef, useTransition } from "react";
import { createItem } from "@/app/(dashboard)/eden/actions";
import { toast } from "sonner";

interface Props {
  boardId: number;
  sectionId?: number;
}

export function QuickCapture({ boardId, sectionId }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    const body = ref.current?.value.trim();
    if (!body) return;
    const fd = new FormData();
    fd.set("boardId", String(boardId));
    fd.set("kind", "card");
    fd.set("body", body);
    if (sectionId) fd.set("sectionId", String(sectionId));
    startTransition(async () => {
      try {
        await createItem(fd);
        if (ref.current) ref.current.value = "";
        ref.current?.focus();
      } catch {
        toast.error("Failed to save");
      }
    });
  }

  return (
    <div className="space-y-1">
      <textarea
        ref={ref}
        placeholder="Nueva idea..."
        rows={2}
        disabled={pending}
        className="w-full resize-none rounded-xl border border-dashed border-border/70 bg-transparent px-3 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-solid focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-50"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      />
      <p className="text-[10px] text-muted-foreground/40 px-1">
        ⌘ + Enter para guardar
      </p>
    </div>
  );
}
