"use client";

import { useState, useMemo } from "react";
import type { VaultNode, VaultNodeDir, VaultNodeFile } from "@/lib/obsidian/vault";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen, Search } from "lucide-react";
import { cn } from "@/lib/utils";

function flattenFiles(tree: VaultNodeDir): VaultNodeFile[] {
  const out: VaultNodeFile[] = [];
  const walk = (n: VaultNode) => {
    if (n.type === "file") out.push(n);
    else for (const c of n.children) walk(c);
  };
  walk(tree);
  return out;
}

export function VaultTree({
  tree,
  activePath,
  onSelect,
}: {
  tree: VaultNodeDir;
  activePath: string | null;
  onSelect: (relPath: string) => void;
}) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();

  // When searching, show flat filtered list. Otherwise, show tree.
  const flatResults = useMemo(() => {
    if (!needle) return null;
    return flattenFiles(tree).filter((f) =>
      f.title.toLowerCase().includes(needle)
    );
  }, [tree, needle]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar..."
            className="h-8 pl-7 text-xs"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-1 text-sm">
        {flatResults ? (
          flatResults.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-4 text-center">
              Sin resultados
            </p>
          ) : (
            flatResults.map((f) => (
              <FileRow
                key={f.relPath}
                file={f}
                indent={0}
                active={activePath === f.relPath}
                onSelect={onSelect}
              />
            ))
          )
        ) : (
          tree.children.map((c) => (
            <TreeNode
              key={c.relPath || c.name}
              node={c}
              indent={0}
              activePath={activePath}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TreeNode({
  node,
  indent,
  activePath,
  onSelect,
}: {
  node: VaultNode;
  indent: number;
  activePath: string | null;
  onSelect: (relPath: string) => void;
}) {
  if (node.type === "file") {
    return (
      <FileRow
        file={node}
        indent={indent}
        active={activePath === node.relPath}
        onSelect={onSelect}
      />
    );
  }
  return <DirRow dir={node} indent={indent} activePath={activePath} onSelect={onSelect} />;
}

function DirRow({
  dir,
  indent,
  activePath,
  onSelect,
}: {
  dir: VaultNodeDir;
  indent: number;
  activePath: string | null;
  onSelect: (relPath: string) => void;
}) {
  // Auto-expand top-level dirs and dirs containing the active file
  const containsActive = activePath ? activePath.startsWith(dir.relPath + "/") : false;
  const [open, setOpen] = useState(indent === 0 || containsActive);

  return (
    <div>
      <button
        type="button"
        className="w-full flex items-center gap-1 px-2 py-1 hover:bg-muted/50 rounded text-left"
        style={{ paddingLeft: `${indent * 12 + 8}px` }}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground" />
        )}
        {open ? (
          <FolderOpen className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <Folder className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="text-xs font-medium truncate">{dir.name}</span>
      </button>
      {open &&
        dir.children.map((c) => (
          <TreeNode
            key={c.relPath || c.name}
            node={c}
            indent={indent + 1}
            activePath={activePath}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

function FileRow({
  file,
  indent,
  active,
  onSelect,
}: {
  file: VaultNodeFile;
  indent: number;
  active: boolean;
  onSelect: (relPath: string) => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "w-full flex items-center gap-1.5 px-2 py-1 rounded text-left",
        active ? "bg-foreground text-background" : "hover:bg-muted/50"
      )}
      style={{ paddingLeft: `${indent * 12 + 22}px` }}
      onClick={() => onSelect(file.relPath)}
      title={file.relPath}
    >
      <FileText className="w-3.5 h-3.5 shrink-0 opacity-70" />
      <span className="text-xs truncate">{file.title}</span>
    </button>
  );
}
