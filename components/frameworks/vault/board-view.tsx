"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createSection, deleteSection, createItem, resolveLink } from "@/app/(dashboard)/eden/actions";
import { BoardChat } from "./board-chat";
import { QuickCapture } from "./quick-capture";
import { ItemCard } from "./item-card";
import { toast } from "sonner";
import type { VaultBoard, VaultSection, VaultItem } from "@/lib/db/vault-schema";

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } },
};

const corFields = [
  { name: "problem", label: "Problem", placeholder: "Qué dolor / limitación resuelve" },
  { name: "goal", label: "Goal", placeholder: "Qué resultado deseado plantea" },
  { name: "example", label: "Example", placeholder: "Un caso concreto" },
  { name: "benefit", label: "Benefit", placeholder: "Por qué importa" },
  { name: "process", label: "Process", placeholder: "Cómo se aplica" },
  { name: "concept", label: "Concept", placeholder: "La mental model detrás" },
] as const;

type AddingMode = null | "card" | "doc" | "idea" | "link" | "section";

interface Props {
  board: VaultBoard;
  sections: VaultSection[];
  items: VaultItem[];
}

export function BoardView({ board, sections, items }: Props) {
  const [activeTab, setActiveTab] = useState<"all" | number>("all");
  const [addingMode, setAddingMode] = useState<AddingMode>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [addingSection, setAddingSection] = useState(false);
  const [linkResolving, setLinkResolving] = useState(false);
  const [pending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sectionNameRef = useRef<HTMLInputElement>(null);
  const docTitleRef = useRef<HTMLInputElement>(null);
  const docBodyRef = useRef<HTMLTextAreaElement>(null);
  const ideaTitleRef = useRef<HTMLInputElement>(null);
  const ideaProblemRef = useRef<HTMLTextAreaElement>(null);
  const ideaGoalRef = useRef<HTMLTextAreaElement>(null);
  const ideaExampleRef = useRef<HTMLTextAreaElement>(null);
  const ideaBenefitRef = useRef<HTMLTextAreaElement>(null);
  const ideaProcessRef = useRef<HTMLTextAreaElement>(null);
  const ideaConceptRef = useRef<HTMLTextAreaElement>(null);
  const ideaSourceLabelRef = useRef<HTMLInputElement>(null);
  const ideaSourceUrlRef = useRef<HTMLInputElement>(null);
  const ideaTagsRef = useRef<HTMLInputElement>(null);
  const linkUrlRef = useRef<HTMLInputElement>(null);
  const cardBodyRef = useRef<HTMLTextAreaElement>(null);

  const visibleItems = activeTab === "all" ? items : items.filter((i) => i.sectionId === activeTab);
  const activeSectionId = activeTab === "all" ? undefined : activeTab;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showDropdown]);

  function selectMode(mode: AddingMode) {
    setShowDropdown(false);
    setAddingMode(mode);
    if (mode === "section") {
      setAddingSection(true);
      setTimeout(() => sectionNameRef.current?.focus(), 50);
    }
  }

  function handleAddSection(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = sectionNameRef.current?.value.trim();
    if (!name) { setAddingSection(false); setAddingMode(null); return; }
    const fd = new FormData();
    fd.set("boardId", String(board.id));
    fd.set("name", name);
    fd.set("position", String(sections.length));
    startTransition(async () => {
      try {
        await createSection(fd);
        setAddingSection(false);
        setAddingMode(null);
        toast.success("Sección creada");
      } catch { toast.error("Error al crear sección"); }
    });
  }

  function handleDeleteSection(sectionId: number) {
    const fd = new FormData();
    fd.set("id", String(sectionId));
    startTransition(async () => {
      try {
        await deleteSection(fd);
        if (activeTab === sectionId) setActiveTab("all");
      } catch { toast.error("Error al eliminar sección"); }
    });
  }

  function handleAddCard(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("boardId", String(board.id));
    fd.set("kind", "card");
    fd.set("body", cardBodyRef.current?.value ?? "");
    if (activeSectionId) fd.set("sectionId", String(activeSectionId));
    startTransition(async () => {
      try {
        await createItem(fd);
        setAddingMode(null);
        toast.success("Card creada");
      } catch { toast.error("Error"); }
    });
  }

  function handleAddDoc(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("boardId", String(board.id));
    fd.set("kind", "doc");
    fd.set("title", docTitleRef.current?.value ?? "");
    fd.set("body", docBodyRef.current?.value ?? "");
    if (activeSectionId) fd.set("sectionId", String(activeSectionId));
    startTransition(async () => {
      try {
        await createItem(fd);
        setAddingMode(null);
        toast.success("Doc creado");
      } catch { toast.error("Error"); }
    });
  }

  function handleAddIdea(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const tagsRaw = ideaTagsRef.current?.value ?? "";
    const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
    const cor = {
      problem: ideaProblemRef.current?.value || undefined,
      goal: ideaGoalRef.current?.value || undefined,
      example: ideaExampleRef.current?.value || undefined,
      benefit: ideaBenefitRef.current?.value || undefined,
      process: ideaProcessRef.current?.value || undefined,
      concept: ideaConceptRef.current?.value || undefined,
      sourceLabel: ideaSourceLabelRef.current?.value || undefined,
      sourceUrl: ideaSourceUrlRef.current?.value || undefined,
      tags: tags.length > 0 ? tags : undefined,
    };
    const fd = new FormData();
    fd.set("boardId", String(board.id));
    fd.set("kind", "idea");
    fd.set("title", ideaTitleRef.current?.value ?? "");
    fd.set("body", JSON.stringify(cor));
    if (activeSectionId) fd.set("sectionId", String(activeSectionId));
    startTransition(async () => {
      try {
        await createItem(fd);
        setAddingMode(null);
        toast.success("Idea guardada");
      } catch { toast.error("Error"); }
    });
  }

  async function handlePasteLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const url = linkUrlRef.current?.value.trim();
    if (!url) return;
    setLinkResolving(true);
    try {
      const resolved = await resolveLink(url);
      const fd = new FormData();
      fd.set("boardId", String(board.id));
      fd.set("kind", "link");
      fd.set("title", resolved.title ?? url);
      fd.set("body", url);
      if (activeSectionId) fd.set("sectionId", String(activeSectionId));
      await createItem(fd);
      setAddingMode(null);
      toast.success("Link guardado");
    } catch {
      toast.error("Error al guardar link");
    } finally {
      setLinkResolving(false);
    }
  }

  const dropdownItems = [
    { icon: "🔗", label: "Paste a link", mode: "link" as AddingMode, shortcut: "L" },
    { icon: "📄", label: "Create a document", mode: "doc" as AddingMode, shortcut: "D" },
    { icon: "🃏", label: "Create a card", mode: "card" as AddingMode, shortcut: "C" },
    { icon: "💡", label: "Create an idea", mode: "idea" as AddingMode, shortcut: "I" },
    null, // divider
    { icon: "➕", label: "Add section", mode: "section" as AddingMode, shortcut: "S" },
  ];

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Board header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <h2 className="font-semibold text-xl tracking-tight">{board.name}</h2>

          {/* Unified + dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown((v) => !v)}
              className={`w-7 h-7 rounded-md flex items-center justify-center text-sm font-medium transition-colors ${
                showDropdown ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/50"
              }`}
            >
              +
            </button>
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  className="absolute right-0 top-9 z-30 bg-popover border border-border rounded-xl shadow-lg py-1.5 w-52 text-sm overflow-hidden"
                >
                  {dropdownItems.map((item, i) =>
                    item === null ? (
                      <div key={i} className="h-px bg-border/60 my-1 mx-2" />
                    ) : (
                      <button
                        key={item.mode}
                        className="w-full text-left px-3 py-1.5 hover:bg-accent transition-colors flex items-center justify-between gap-2"
                        onClick={() => selectMode(item.mode)}
                      >
                        <span className="flex items-center gap-2">
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground/50 font-mono">{item.shortcut}</span>
                      </button>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 px-6 py-2 border-b border-border/40 overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`shrink-0 text-sm px-3 py-1 rounded-md transition-colors ${
              activeTab === "all" ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            All
          </button>

          <AnimatePresence>
            {sections.map((section) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, scale: 0.9, x: -6 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -6 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="group relative shrink-0 flex items-center"
              >
                <button
                  onClick={() => setActiveTab(section.id)}
                  className={`text-sm px-3 py-1 rounded-md transition-colors pr-6 ${
                    activeTab === section.id ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {section.name}
                </button>
                <button
                  onClick={() => handleDeleteSection(section.id)}
                  className="absolute right-1 text-xs text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center rounded hover:bg-destructive/10"
                >
                  ×
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add section inline input (in tab bar) */}
          <AnimatePresence mode="wait">
            {addingSection ? (
              <motion.form
                key="section-input"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                onSubmit={handleAddSection}
                className="overflow-hidden shrink-0"
              >
                <input
                  ref={sectionNameRef}
                  placeholder="Nombre..."
                  autoFocus
                  className="text-sm rounded-md border border-border bg-card px-2.5 py-1 focus:outline-none focus:border-ring/60 w-36"
                  onBlur={() => { setAddingSection(false); setAddingMode(null); }}
                  onKeyDown={(e) => { if (e.key === "Escape") { setAddingSection(false); setAddingMode(null); } }}
                />
              </motion.form>
            ) : (
              <motion.button
                key="section-plus"
                onClick={() => selectMode("section")}
                className="shrink-0 text-sm text-muted-foreground/60 hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/50 transition-colors"
              >
                +
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="max-w-2xl space-y-3">

            {/* Paste link form */}
            <AnimatePresence>
              {addingMode === "link" && (
                <motion.form
                  key="link-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  onSubmit={handlePasteLink}
                  className="rounded-xl border border-dashed border-border bg-card/50 p-4 space-y-2 overflow-hidden"
                >
                  <p className="text-xs font-semibold text-muted-foreground">🔗 Paste a link</p>
                  <input
                    ref={linkUrlRef}
                    type="url"
                    placeholder="https://..."
                    autoFocus
                    className="w-full text-sm bg-muted/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/20 border border-border/50"
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setAddingMode(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
                    <button type="submit" disabled={linkResolving || pending} className="text-xs font-medium text-primary hover:opacity-80 transition-opacity disabled:opacity-50">
                      {linkResolving ? "Resolviendo..." : "Guardar"}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Create card form */}
            <AnimatePresence>
              {addingMode === "card" && (
                <motion.form
                  key="card-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  onSubmit={handleAddCard}
                  className="rounded-xl border border-dashed border-border bg-card/50 p-4 space-y-2 overflow-hidden"
                >
                  <p className="text-xs font-semibold text-muted-foreground">🃏 Create a card</p>
                  <textarea
                    ref={cardBodyRef}
                    rows={3}
                    placeholder="Contenido..."
                    autoFocus
                    className="w-full resize-none text-sm bg-transparent focus:outline-none leading-relaxed"
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setAddingMode(null)} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
                    <button type="submit" disabled={pending} className="text-xs font-medium text-primary hover:opacity-80 disabled:opacity-50">Crear</button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Create doc form */}
            <AnimatePresence>
              {addingMode === "doc" && (
                <motion.form
                  key="doc-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  onSubmit={handleAddDoc}
                  className="rounded-xl border border-dashed border-border bg-card/50 p-4 space-y-2 overflow-hidden"
                >
                  <p className="text-xs font-semibold text-muted-foreground">📄 Create a document</p>
                  <input ref={docTitleRef} placeholder="Título del doc" autoFocus className="w-full text-sm font-semibold bg-transparent border-b border-border focus:outline-none focus:border-primary/40 pb-1.5" />
                  <textarea ref={docBodyRef} rows={5} placeholder="Contenido..." className="w-full resize-none text-sm bg-transparent focus:outline-none leading-relaxed" />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setAddingMode(null)} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
                    <button type="submit" disabled={pending} className="text-xs font-medium text-primary hover:opacity-80 disabled:opacity-50">Crear doc</button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Create idea form (COR) */}
            <AnimatePresence>
              {addingMode === "idea" && (
                <motion.form
                  key="idea-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 35 }}
                  onSubmit={handleAddIdea}
                  className="rounded-xl border border-dashed border-primary/30 bg-card/60 p-4 space-y-3 overflow-hidden"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/60">💡 COR Idea</span>
                  </div>
                  <input ref={ideaTitleRef} placeholder="Título de la idea *" required autoFocus className="w-full text-sm font-semibold bg-transparent border-b border-border focus:outline-none focus:border-primary/40 pb-1.5" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { ref: ideaProblemRef, field: corFields[0] },
                      { ref: ideaGoalRef, field: corFields[1] },
                      { ref: ideaExampleRef, field: corFields[2] },
                      { ref: ideaBenefitRef, field: corFields[3] },
                      { ref: ideaProcessRef, field: corFields[4] },
                      { ref: ideaConceptRef, field: corFields[5] },
                    ].map(({ ref, field }) => (
                      <div key={field.name}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">{field.label}</p>
                        <textarea ref={ref} placeholder={field.placeholder} rows={2} className="w-full resize-none text-xs bg-muted/20 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary/20 leading-relaxed placeholder:text-muted-foreground/40" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Fuente</p>
                      <input ref={ideaSourceLabelRef} placeholder="Libro / Podcast..." className="w-full text-xs bg-muted/20 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/20" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">URL</p>
                      <input ref={ideaSourceUrlRef} placeholder="https://..." type="url" className="w-full text-xs bg-muted/20 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/20" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Tags</p>
                      <input ref={ideaTagsRef} placeholder="writing, mental-model..." className="w-full text-xs bg-muted/20 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/20" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <button type="button" onClick={() => setAddingMode(null)} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
                    <button type="submit" disabled={pending} className="text-xs font-medium text-primary hover:opacity-80 disabled:opacity-50">Guardar idea</button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Items list */}
            <AnimatePresence mode="wait">
              <motion.div
                key={String(activeTab)}
                variants={listVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                className="space-y-2"
              >
                {visibleItems.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-muted-foreground/50">
                    <span className="text-2xl mb-2">✦</span>
                    <p className="text-sm">Sin contenido</p>
                    <p className="text-xs mt-1 opacity-60">Usá el "+" del header para añadir</p>
                  </motion.div>
                ) : (
                  visibleItems.map((item) => (
                    <motion.div key={item.id} variants={itemVariants}>
                      <ItemCard item={item} />
                    </motion.div>
                  ))
                )}
              </motion.div>
            </AnimatePresence>

            {/* Quick Capture */}
            <div className="pt-2">
              <QuickCapture boardId={board.id} sectionId={activeSectionId} />
            </div>
          </div>
        </div>
      </div>

      <BoardChat items={items} boardId={board.id} activeSectionId={activeSectionId} />
    </div>
  );
}
