"use client";

import { useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createItem, deleteSection } from "@/app/(dashboard)/vault/actions";
import { ItemCard } from "./item-card";
import { QuickCapture } from "./quick-capture";
import { toast } from "sonner";
import type { VaultSection, VaultItem } from "@/lib/db/vault-schema";

const containerVariants = {
  visible: { transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } },
};

interface Props {
  section: VaultSection;
  items: VaultItem[];
  boardId: number;
}

export function SectionCol({ section, items, boardId }: Props) {
  const [addingDoc, setAddingDoc] = useState(false);
  const [pending, startTransition] = useTransition();
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  function handleDeleteSection() {
    const fd = new FormData();
    fd.set("id", String(section.id));
    startTransition(async () => {
      try {
        await deleteSection(fd);
      } catch {
        toast.error("Error al eliminar sección");
      }
    });
  }

  function handleAddDoc(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("boardId", String(boardId));
    fd.set("sectionId", String(section.id));
    fd.set("kind", "doc");
    fd.set("title", titleRef.current?.value ?? "");
    fd.set("body", bodyRef.current?.value ?? "");
    startTransition(async () => {
      try {
        await createItem(fd);
        setAddingDoc(false);
        toast.success("Doc creado");
      } catch {
        toast.error("Error al crear doc");
      }
    });
  }

  return (
    <div className="flex-shrink-0 w-72 flex flex-col gap-3 bg-muted/20 rounded-xl p-3">
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/70">
          {section.name}
          <span className="ml-1.5 text-muted-foreground/50 font-normal normal-case tracking-normal">
            {items.length}
          </span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setAddingDoc((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            + Doc
          </button>
          <button
            onClick={handleDeleteSection}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            ×
          </button>
        </div>
      </div>

      <motion.div
        className="flex flex-col gap-2 flex-1"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {items.map((item) => (
          <motion.div key={item.id} variants={itemVariants}>
            <ItemCard item={item} />
          </motion.div>
        ))}
      </motion.div>

      <AnimatePresence>
        {addingDoc && (
          <motion.form
            key="doc-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            onSubmit={handleAddDoc}
            className="space-y-2 rounded-xl border border-dashed border-border bg-card/50 p-3 overflow-hidden"
          >
            <input
              ref={titleRef}
              placeholder="Título del doc"
              className="w-full text-sm bg-transparent border-b border-border focus:outline-none focus:border-primary/40 pb-1"
            />
            <textarea
              ref={bodyRef}
              rows={5}
              placeholder="Contenido..."
              className="w-full resize-none text-sm bg-transparent focus:outline-none leading-relaxed"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setAddingDoc(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button type="submit" className="text-xs font-medium text-primary hover:opacity-80 transition-opacity">
                Crear doc
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <QuickCapture boardId={boardId} sectionId={section.id} />
    </div>
  );
}
