// @ts-nocheck — legacy chat UI, not used in current nav
"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { ChatPanel } from "./chat-panel";

export function ChatBubble() {
  const [open, setOpen] = useState(false);

  // Cmd/Ctrl + K to toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-12 px-4 rounded-full bg-foreground text-background shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2 text-sm font-medium group"
        title="Chat con Dan Koe (Cmd+K)"
      >
        <Sparkles className="w-4 h-4" />
        <span>Dan Koe</span>
        <kbd className="hidden sm:inline text-[10px] opacity-60 ml-1 group-hover:opacity-100 transition-opacity">
          âŒ˜K
        </kbd>
      </button>

      <ChatPanel open={open} onOpenChange={setOpen} />
    </>
  );
}

