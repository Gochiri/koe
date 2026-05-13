// @ts-nocheck — legacy chat UI, not used in current nav
"use client";

import { useEffect, useState, useTransition } from "react";
import { searchMentions } from "@/app/(dashboard)/chat/actions";
import type { MentionSearchResult } from "@/lib/chat/mentions";
import { Badge } from "@/components/ui/badge";

export function MentionPicker({
  query,
  onSelect,
  onClose,
}: {
  query: string;
  onSelect: (m: MentionSearchResult) => void;
  onClose: () => void;
}) {
  const [results, setResults] = useState<MentionSearchResult[]>([]);
  const [, startTransition] = useTransition();
  const [hoverIdx, setHoverIdx] = useState(0);

  useEffect(() => {
    startTransition(async () => {
      try {
        const r = await searchMentions(query);
        setResults(r);
        setHoverIdx(0);
      } catch {
        setResults([]);
      }
    });
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHoverIdx((i) => Math.min(results.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHoverIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter" || e.key === "Tab") {
        if (results[hoverIdx]) {
          e.preventDefault();
          onSelect(results[hoverIdx]);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [results, hoverIdx, onSelect, onClose]);

  if (results.length === 0) {
    return (
      <div className="rounded-md border bg-popover p-3 text-sm text-muted-foreground shadow-md">
        Sin resultados para â€œ{query}â€
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-popover shadow-md max-h-72 overflow-y-auto">
      {results.map((r, i) => (
        <button
          key={`${r.type}-${r.id}`}
          type="button"
          className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
            i === hoverIdx ? "bg-muted" : "hover:bg-muted/50"
          }`}
          onMouseEnter={() => setHoverIdx(i)}
          onClick={() => onSelect(r)}
        >
          <Badge variant="outline" className="text-[10px] shrink-0">
            {r.typeLabel}
          </Badge>
          <span className="truncate flex-1">{r.label}</span>
          {r.subtitle && (
            <span className="text-xs text-muted-foreground shrink-0">{r.subtitle}</span>
          )}
        </button>
      ))}
    </div>
  );
}

