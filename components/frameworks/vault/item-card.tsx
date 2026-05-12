"use client";

import { useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { updateItem, deleteItem } from "@/app/(dashboard)/vault/actions";
import { toast } from "sonner";
import type { VaultItem } from "@/lib/db/vault-schema";

interface Props {
  item: VaultItem;
}

export function ItemCard({ item }: Props) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  function handleSave() {
    const fd = new FormData();
    fd.set("id", String(item.id));
    fd.set("body", bodyRef.current?.value ?? "");
    fd.set("title", titleRef.current?.value ?? "");
    startTransition(async () => {
      try {
        await updateItem(fd);
        setEditing(false);
      } catch {
        toast.error("Error al guardar");
      }
    });
  }

  function handleDelete() {
    const fd = new FormData();
    fd.set("id", String(item.id));
    startTransition(async () => {
      try {
        await deleteItem(fd);
      } catch {
        toast.error("Error al eliminar");
      }
    });
  }

  return (
    <AnimatePresence mode="wait">
      {editing ? (
        <motion.div
          key="editing"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="rounded-xl border border-ring/60 bg-card shadow-sm p-4 space-y-2"
        >
          {item.kind === "doc" && (
            <input
              ref={titleRef}
              defaultValue={item.title ?? ""}
              placeholder="Título"
              className="w-full text-sm font-semibold bg-transparent border-b border-border focus:outline-none focus:border-primary/50 pb-1.5 mb-1"
            />
          )}
          <textarea
            ref={bodyRef}
            defaultValue={item.body ?? ""}
            rows={item.kind === "doc" ? 8 : 4}
            autoFocus
            className="w-full resize-none text-sm bg-transparent focus:outline-none leading-relaxed"
          />
          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={pending}
              className="text-xs font-medium text-primary hover:opacity-80 transition-opacity"
            >
              Guardar
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="viewing"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          whileHover={{ y: -2, boxShadow: "0 4px 20px oklch(0 0 0 / 10%)" }}
          className={`group relative rounded-xl border border-border bg-card p-4 cursor-pointer transition-colors hover:border-border/80 ${
            item.kind === "doc" ? "border-l-2 border-l-primary/40 min-h-[80px]" : ""
          }`}
          onClick={() => setEditing(true)}
        >
          {item.kind === "doc" && item.title && (
            <p className="text-xs font-semibold mb-1.5 text-foreground tracking-tight">
              {item.title}
            </p>
          )}
          <p className="text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed">
            {item.body || (
              <span className="text-muted-foreground/60 italic text-xs">Sin contenido</span>
            )}
          </p>
          <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 items-center">
            <span className="text-[10px] text-muted-foreground bg-muted/80 rounded px-1.5 py-0.5 font-medium">
              {item.kind}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="text-muted-foreground hover:text-destructive text-sm leading-none w-5 h-5 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
