"use client";

import { useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createSection } from "@/app/(dashboard)/vault/actions";
import { SectionCol } from "./section-col";
import { BoardChat } from "./board-chat";
import { QuickCapture } from "./quick-capture";
import { ItemCard } from "./item-card";
import { toast } from "sonner";
import type { VaultBoard, VaultSection, VaultItem } from "@/lib/db/vault-schema";

interface Props {
  board: VaultBoard;
  sections: VaultSection[];
  items: VaultItem[];
}

export function BoardView({ board, sections, items }: Props) {
  const [addingSection, setAddingSection] = useState(false);
  const [pending, startTransition] = useTransition();
  const sectionNameRef = useRef<HTMLInputElement>(null);

  const unsectioned = items.filter((i) => i.sectionId === null);

  function handleAddSection(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("boardId", String(board.id));
    fd.set("name", sectionNameRef.current?.value ?? "Nueva sección");
    fd.set("position", String(sections.length));
    startTransition(async () => {
      try {
        await createSection(fd);
        setAddingSection(false);
        toast.success("Sección creada");
      } catch {
        toast.error("Error al crear sección");
      }
    });
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <h2 className="font-semibold text-xl tracking-tight">{board.name}</h2>
          <button
            onClick={() => {
              setAddingSection(true);
              setTimeout(() => sectionNameRef.current?.focus(), 50);
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50"
          >
            + Sección
          </button>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto px-6 py-5">
          <div className="flex gap-4 min-h-full items-start">
            <AnimatePresence>
              {sections.map((section) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, scale: 0.95, x: 12 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.93, x: -8 }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="flex-shrink-0"
                >
                  <SectionCol
                    section={section}
                    items={items.filter((i) => i.sectionId === section.id)}
                    boardId={board.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            <AnimatePresence>
              {addingSection && (
                <motion.div
                  key="add-section-input"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 288 }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  className="flex-shrink-0 overflow-hidden"
                >
                  <form onSubmit={handleAddSection} className="space-y-2 w-72">
                    <input
                      ref={sectionNameRef}
                      placeholder="Nombre de la sección"
                      className="w-full text-sm rounded-xl border border-border bg-card px-3 py-2 focus:outline-none focus:border-ring/60"
                      onBlur={() => setAddingSection(false)}
                      onKeyDown={(e) => e.key === "Escape" && setAddingSection(false)}
                    />
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {unsectioned.length > 0 && (
              <div className="flex-shrink-0 w-72 flex flex-col gap-2 bg-muted/20 rounded-xl p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/70 pb-2 border-b border-border/50">
                  Sin sección
                  <span className="ml-1.5 text-muted-foreground/50 font-normal normal-case tracking-normal">
                    {unsectioned.length}
                  </span>
                </h3>
                {unsectioned.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}

            <div className="flex-shrink-0 w-72">
              <QuickCapture boardId={board.id} />
            </div>
          </div>
        </div>
      </div>

      <BoardChat items={items} />
    </div>
  );
}
