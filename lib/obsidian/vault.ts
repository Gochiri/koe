/**
 * Server-side Obsidian vault reader.
 *
 * Reads `.md` files from a local folder configured via OBSIDIAN_VAULT_PATH.
 * Skips:
 *   - `.obsidian/` and any other dotfolder (config, plugins, hidden)
 *   - non-`.md` files (canvas, images, etc.) — for v1
 *
 * All paths returned to the UI are RELATIVE to the vault root (forward-slash
 * normalized), never absolute — never expose `C:\Users\...` to the client.
 */

import { promises as fs } from "fs";
import path from "path";
import { env } from "@/lib/env";

export type VaultNodeDir = {
  type: "dir";
  name: string;
  relPath: string; // "" for root, "Inbox", "Content/Borradores"
  children: VaultNode[];
};

export type VaultNodeFile = {
  type: "file";
  name: string; // "MyNote.md"
  title: string; // "MyNote" (filename without .md)
  relPath: string; // "Content/Borradores/MyNote.md"
  size: number;
  mtime: number; // unix ms
};

export type VaultNode = VaultNodeDir | VaultNodeFile;

export function isVaultConfigured(): boolean {
  return !!env.OBSIDIAN_VAULT_PATH;
}

export function getVaultRoot(): string {
  if (!env.OBSIDIAN_VAULT_PATH) {
    throw new Error("OBSIDIAN_VAULT_PATH no está configurado en .env.local");
  }
  return env.OBSIDIAN_VAULT_PATH;
}

/**
 * Convert a forward-slash relPath to an absolute, validated path inside the vault.
 * Throws if the relPath tries to escape (path traversal).
 */
export function resolveInsideVault(relPath: string): string {
  const root = getVaultRoot();
  // Normalize forward → OS separator, strip any leading slash
  const cleaned = relPath.replace(/^\/+/, "").split("/").join(path.sep);
  const abs = path.resolve(root, cleaned);
  const absRoot = path.resolve(root);
  if (abs !== absRoot && !abs.startsWith(absRoot + path.sep)) {
    throw new Error(`Path escapes vault: ${relPath}`);
  }
  return abs;
}

/**
 * Recursively read the vault folder tree. Filters out hidden folders and
 * non-.md files. Returns the root as a synthetic VaultNodeDir (name="").
 */
export async function readVaultTree(): Promise<VaultNodeDir> {
  const root = getVaultRoot();
  return readDir(root, "");
}

async function readDir(absDir: string, relDir: string): Promise<VaultNodeDir> {
  const entries = await fs.readdir(absDir, { withFileTypes: true });
  const children: VaultNode[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue; // skip .obsidian, .git, etc.
    const absEntry = path.join(absDir, entry.name);
    const relEntry = relDir ? `${relDir}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const sub = await readDir(absEntry, relEntry);
      // Only include non-empty dirs in the tree (cleaner UX)
      if (sub.children.length > 0) children.push(sub);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      const stat = await fs.stat(absEntry);
      children.push({
        type: "file",
        name: entry.name,
        title: entry.name.replace(/\.md$/i, ""),
        relPath: relEntry,
        size: stat.size,
        mtime: stat.mtimeMs,
      });
    }
  }

  // Sort: dirs first, then files; alphabetical within each
  children.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });

  return {
    type: "dir",
    name: path.basename(absDir) || "",
    relPath: relDir,
    children,
  };
}

/**
 * Flatten the tree into a list of file nodes only — handy for search & mentions.
 */
export function flattenFiles(tree: VaultNodeDir): VaultNodeFile[] {
  const out: VaultNodeFile[] = [];
  const walk = (n: VaultNode) => {
    if (n.type === "file") out.push(n);
    else for (const c of n.children) walk(c);
  };
  walk(tree);
  return out;
}

/**
 * Read the raw markdown content of a single file by its vault-relative path.
 */
export async function readVaultFile(
  relPath: string
): Promise<{ content: string; mtime: number; size: number }> {
  if (!relPath.toLowerCase().endsWith(".md")) {
    throw new Error("Solo se pueden leer archivos .md por ahora");
  }
  const abs = resolveInsideVault(relPath);
  const [content, stat] = await Promise.all([
    fs.readFile(abs, "utf8"),
    fs.stat(abs),
  ]);
  return { content, mtime: stat.mtimeMs, size: stat.size };
}

/**
 * Free-text search across vault files. Naive: scans filenames + content
 * substring (case-insensitive). For 54 files this is plenty fast.
 */
export async function searchVault(
  q: string,
  limit = 20
): Promise<Array<VaultNodeFile & { snippet?: string }>> {
  const needle = q.trim().toLowerCase();
  if (!needle) {
    const tree = await readVaultTree();
    return flattenFiles(tree)
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, limit);
  }

  const tree = await readVaultTree();
  const all = flattenFiles(tree);
  const results: Array<VaultNodeFile & { snippet?: string; score: number }> = [];

  for (const f of all) {
    const titleHit = f.title.toLowerCase().includes(needle);
    let snippet: string | undefined;
    let contentHit = false;

    if (!titleHit || titleHit) {
      // Read content for snippet/highlight (cheap enough for small vaults)
      try {
        const { content } = await readVaultFile(f.relPath);
        const lower = content.toLowerCase();
        const idx = lower.indexOf(needle);
        if (idx >= 0) {
          contentHit = true;
          const start = Math.max(0, idx - 40);
          const end = Math.min(content.length, idx + needle.length + 60);
          snippet =
            (start > 0 ? "…" : "") +
            content.slice(start, end).replace(/\s+/g, " ") +
            (end < content.length ? "…" : "");
        }
      } catch {
        /* ignore unreadable files */
      }
    }

    if (titleHit || contentHit) {
      results.push({
        ...f,
        snippet,
        score: (titleHit ? 10 : 0) + (contentHit ? 1 : 0),
      });
    }
  }

  results.sort((a, b) => b.score - a.score || b.mtime - a.mtime);
  return results.slice(0, limit).map(({ score: _s, ...rest }) => rest);
}
