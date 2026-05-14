"use client";

import { useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { updateItem, deleteItem } from "@/app/(dashboard)/eden/actions";
import { toast } from "sonner";
import type { VaultItem, VaultSection } from "@/lib/db/vault-schema";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface Props {
  item: VaultItem;
  sections?: VaultSection[];
}

type CorBody = {
  problem?: string;
  goal?: string;
  example?: string;
  benefit?: string;
  process?: string;
  concept?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  tags?: string[];
};

const corFieldLabels: { key: keyof CorBody; label: string }[] = [
  { key: "problem", label: "Problem" },
  { key: "goal", label: "Goal" },
  { key: "example", label: "Example" },
  { key: "benefit", label: "Benefit" },
  { key: "process", label: "Process" },
  { key: "concept", label: "Concept" },
];

function parseCorBody(body: string | null): CorBody {
  if (!body) return {};
  try { return JSON.parse(body); } catch { return {}; }
}

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
  } catch {}
  return null;
}

function VideoPreview({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const videoId = getYouTubeId(url);
  if (!videoId) return null;

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden bg-black aspect-video"
      onClick={(e) => e.stopPropagation()}
    >
      {playing ? (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          className="w-full h-full"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
        />
      ) : (
        <button onClick={() => setPlaying(true)} className="w-full h-full relative group/thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt="Video preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/thumb:bg-black/20 transition-colors">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform">
              <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}

function IdeaView({ item, onEdit, onDelete, dragListeners }: {
  item: VaultItem;
  onEdit: () => void;
  onDelete: () => void;
  dragListeners?: React.HTMLAttributes<HTMLElement>;
}) {
  const [expanded, setExpanded] = useState(false);
  const cor = parseCorBody(item.body);
  const filledFields = corFieldLabels.filter(({ key }) => !!cor[key]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      whileHover={{ boxShadow: "0 4px 20px oklch(0 0 0 / 10%)" }}
      onClick={() => setExpanded((v) => !v)}
      className="group relative rounded-xl border border-border border-l-2 border-l-primary/50 bg-card p-4 cursor-pointer transition-colors hover:border-border/80"
    >
      {/* Drag handle */}
      <div
        {...dragListeners}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-3 h-3 text-foreground/20" />
      </div>

      {/* Action buttons */}
      <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="text-muted-foreground hover:text-foreground text-xs w-6 h-6 flex items-center justify-center rounded hover:bg-muted/80 transition-colors"
          title="Editar"
        >
          ✎
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-muted-foreground hover:text-destructive text-sm w-6 h-6 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors"
          title="Eliminar"
        >
          ×
        </button>
      </div>

      {/* Header */}
      <div className="mb-2 pr-14">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-primary/50 block mb-1">idea</span>
        <p className="text-sm font-semibold leading-snug">{item.title || "Untitled"}</p>
      </div>

      {/* Problem preview (collapsed) */}
      {cor.problem && !expanded && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2">{cor.problem}</p>
      )}

      {/* Tags */}
      {cor.tags && cor.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-2">
          {cor.tags.map((t) => (
            <span key={t} className="text-[10px] bg-muted/60 rounded-full px-2 py-0.5 text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Expand hint */}
      <p className="text-[10px] text-muted-foreground/40">
        {expanded ? "▲ colapsar" : filledFields.length > 0 ? `▼ ver ${filledFields.length} campos` : "▼ sin campos COR — click para editar"}
      </p>

      {/* Expanded COR fields */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3 border-t border-border/50 pt-3">
              {filledFields.length === 0 ? (
                <p className="text-xs text-muted-foreground/50 italic">No hay campos COR. Usá el botón ✎ para completar la idea.</p>
              ) : (
                filledFields.map(({ key, label }) => (
                  <div key={key}>
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-0.5">{label}</p>
                    <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{cor[key]}</p>
                  </div>
                ))
              )}
              {(cor.sourceLabel || cor.sourceUrl) && (
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-0.5">Fuente</p>
                  {cor.sourceUrl ? (
                    <a
                      href={cor.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {cor.sourceLabel || cor.sourceUrl}
                    </a>
                  ) : (
                    <p className="text-xs text-foreground/80">{cor.sourceLabel}</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function IdeaEditForm({ item, onCancel, onSave, pending }: {
  item: VaultItem;
  onCancel: () => void;
  onSave: (fd: FormData) => void;
  pending: boolean;
}) {
  const cor = parseCorBody(item.body);
  const titleRef = useRef<HTMLInputElement>(null);
  const problemRef = useRef<HTMLTextAreaElement>(null);
  const goalRef = useRef<HTMLTextAreaElement>(null);
  const exampleRef = useRef<HTMLTextAreaElement>(null);
  const benefitRef = useRef<HTMLTextAreaElement>(null);
  const processRef = useRef<HTMLTextAreaElement>(null);
  const conceptRef = useRef<HTMLTextAreaElement>(null);
  const sourceLabelRef = useRef<HTMLInputElement>(null);
  const sourceUrlRef = useRef<HTMLInputElement>(null);
  const tagsRef = useRef<HTMLInputElement>(null);

  const fieldRefs = { problem: problemRef, goal: goalRef, example: exampleRef, benefit: benefitRef, process: processRef, concept: conceptRef };

  function submit() {
    const tags = tagsRef.current?.value.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
    const updatedCor = {
      problem: problemRef.current?.value || undefined,
      goal: goalRef.current?.value || undefined,
      example: exampleRef.current?.value || undefined,
      benefit: benefitRef.current?.value || undefined,
      process: processRef.current?.value || undefined,
      concept: conceptRef.current?.value || undefined,
      sourceLabel: sourceLabelRef.current?.value || undefined,
      sourceUrl: sourceUrlRef.current?.value || undefined,
      tags: tags.length > 0 ? tags : undefined,
    };
    const fd = new FormData();
    fd.set("id", String(item.id));
    fd.set("title", titleRef.current?.value ?? "");
    fd.set("body", JSON.stringify(updatedCor));
    onSave(fd);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
      className="rounded-xl border border-ring/60 bg-card shadow-sm p-4 space-y-3"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/60">COR Idea</span>
      </div>
      <input
        ref={titleRef}
        defaultValue={item.title ?? ""}
        placeholder="Título *"
        autoFocus
        className="w-full text-sm font-semibold bg-transparent border-b border-border focus:outline-none focus:border-primary/50 pb-1.5"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {corFieldLabels.map(({ key, label }) => (
          <div key={key}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">{label}</p>
            <textarea
              ref={fieldRefs[key as keyof typeof fieldRefs]}
              defaultValue={cor[key] ?? ""}
              rows={2}
              className="w-full resize-none text-xs bg-muted/20 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary/20 leading-relaxed"
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Fuente</p>
          <input ref={sourceLabelRef} defaultValue={cor.sourceLabel ?? ""} placeholder="Libro / Podcast..." className="w-full text-xs bg-muted/20 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/20" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">URL</p>
          <input ref={sourceUrlRef} defaultValue={cor.sourceUrl ?? ""} placeholder="https://..." type="url" className="w-full text-xs bg-muted/20 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/20" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Tags</p>
          <input ref={tagsRef} defaultValue={cor.tags?.join(", ") ?? ""} placeholder="writing, mental-model..." className="w-full text-xs bg-muted/20 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/20" />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Cancelar
        </button>
        <button onClick={submit} disabled={pending} className="text-xs font-medium text-primary hover:opacity-80 transition-opacity disabled:opacity-50">
          Guardar
        </button>
      </div>
    </motion.div>
  );
}

export function ItemCard({ item, sections: _sections }: Props) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const bodyIsVideo = (item.kind === "link" || item.kind === "card") && item.body ? getYouTubeId(item.body.trim()) !== null : false;
  const isGenericLink = item.kind === "link" && !bodyIsVideo;

  function handleSave(fd?: FormData) {
    const formData = fd ?? (() => {
      const f = new FormData();
      f.set("id", String(item.id));
      f.set("body", bodyRef.current?.value ?? "");
      f.set("title", titleRef.current?.value ?? "");
      return f;
    })();
    startTransition(async () => {
      try {
        await updateItem(formData);
        setEditing(false);
      } catch {
        toast.error("Failed to save");
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
        toast.error("Failed to delete");
      }
    });
  }

  if (item.kind === "idea") {
    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        <AnimatePresence mode="wait">
          {editing ? (
            <IdeaEditForm
              key="editing"
              item={item}
              onCancel={() => setEditing(false)}
              onSave={handleSave}
              pending={pending}
            />
          ) : (
            <IdeaView
              key="viewing"
              item={item}
              onEdit={() => setEditing(true)}
              onDelete={handleDelete}
              dragListeners={listeners}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="group">
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
              <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleSave()} disabled={pending} className="text-xs font-medium text-primary hover:opacity-80 transition-opacity">
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
            whileHover={bodyIsVideo ? {} : { y: -2, boxShadow: "0 4px 20px oklch(0 0 0 / 10%)" }}
            className={`group relative rounded-xl border border-border bg-card overflow-hidden transition-colors hover:border-border/80 ${
              item.kind === "doc" ? "border-l-2 border-l-primary/40" : ""
            } ${bodyIsVideo || isGenericLink ? "cursor-default" : "cursor-pointer p-4"}`}
            onClick={bodyIsVideo || isGenericLink ? undefined : () => setEditing(true)}
          >
            {/* Drag handle */}
            <div
              {...listeners}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
            >
              <GripVertical className="w-3 h-3 text-foreground/20" />
            </div>

            {bodyIsVideo ? (
              <div>
                <VideoPreview url={item.body!} />
                <div className="px-3 pt-2.5 pb-3 space-y-1.5">
                  <p className="text-xs font-semibold text-foreground leading-snug">
                    {item.title || "Sin título"}
                  </p>
                  {/* Metrics bar — populated once YouTube API key is configured */}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground/35 font-medium tabular-nums">
                    <span title="Vistas">👁 —</span>
                    <span title="Duración">⏱ —</span>
                    <span title="Engagement">📊 —%</span>
                  </div>
                </div>
              </div>
            ) : isGenericLink ? (
              <a
                href={item.body ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-base mt-0.5 shrink-0">🔗</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.title || item.body}</p>
                  {item.title && item.body && (
                    <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">
                      {(() => { try { return new URL(item.body).hostname; } catch { return item.body; } })()}
                    </p>
                  )}
                </div>
              </a>
            ) : (
              <>
                {item.kind === "doc" && item.title && (
                  <p className="text-xs font-semibold mb-1.5 text-foreground tracking-tight">{item.title}</p>
                )}
                <p className="text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed">
                  {item.body || <span className="text-muted-foreground/60 italic text-xs">No content</span>}
                </p>
              </>
            )}

            <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 items-center">
              {!bodyIsVideo && !isGenericLink && (
                <span className="text-[10px] text-muted-foreground bg-muted/80 rounded px-1.5 py-0.5 font-medium">
                  {item.kind}
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                className="text-muted-foreground hover:text-destructive text-sm leading-none w-5 h-5 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
