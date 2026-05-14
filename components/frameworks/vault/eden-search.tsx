"use client";

import { useState, useTransition } from "react";
import { searchItems } from "@/app/(dashboard)/eden/actions";

type SearchResult = {
  id: number;
  title: string | null;
  body: string | null;
  kind: string;
  boardId: number;
  boardName: string;
};

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
  } catch {}
  return null;
}

const KIND_LABELS: Record<string, string> = {
  link: "video",
  doc: "doc",
  card: "card",
  idea: "idea",
};

export function EdenSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    startTransition(async () => {
      const res = await searchItems(query);
      setResults(res);
      setSearched(true);
    });
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 min-h-0">
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 text-sm">🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en todos los boards..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-muted/30 rounded-xl border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/40"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={pending || !query.trim()}
          className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-xl hover:opacity-80 transition-opacity disabled:opacity-30"
        >
          {pending ? "..." : "Buscar"}
        </button>
      </form>

      {!searched && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40 gap-3">
          <span className="text-4xl">🔎</span>
          <p className="text-sm text-center">
            Buscá videos, ideas, docs y cards<br />en todos tus boards
          </p>
        </div>
      )}

      {searched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40 gap-3">
          <span className="text-3xl">∅</span>
          <p className="text-sm">Sin resultados para &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground/40 mb-4 uppercase tracking-widest font-medium">
            {results.length} resultado{results.length !== 1 ? "s" : ""}
          </p>
          {results.map((result) => {
            const videoId =
              (result.kind === "link" || result.kind === "card") && result.body
                ? getYouTubeId(result.body)
                : null;
            return (
              <div
                key={result.id}
                className="flex gap-3 p-3 rounded-xl border border-border/40 bg-card hover:border-border/70 transition-colors"
              >
                {videoId ? (
                  <img
                    src={`https://img.youtube.com/vi/${videoId}/default.jpg`}
                    alt=""
                    className="w-20 h-12 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 text-base">
                    {result.kind === "idea" ? "💡" : result.kind === "doc" ? "📄" : "🃏"}
                  </div>
                )}
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <p className="text-sm font-medium text-foreground truncate leading-tight">
                    {result.title || result.body?.slice(0, 80) || "Sin título"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground/50 bg-muted/40 rounded-full px-2 py-0.5 font-medium">
                      {KIND_LABELS[result.kind] ?? result.kind}
                    </span>
                    <span className="text-[10px] text-muted-foreground/30">·</span>
                    <span className="text-[10px] text-muted-foreground/50">{result.boardName}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
