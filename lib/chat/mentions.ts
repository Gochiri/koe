import { db } from "@/lib/db/client";
import {
  corNotes,
  apagDrafts,
  offers,
  skills,
  mvoPipeline,
  contentPieces,
  trustEntries,
  onePersonVision,
  type ChatMention,
} from "@/lib/db/schema";
import { ilike, or, desc, inArray, eq } from "drizzle-orm";
import {
  isVaultConfigured,
  searchVault,
  readVaultFile,
} from "@/lib/obsidian/vault";

export type MentionType = ChatMention["type"];

const TYPE_LABELS: Record<MentionType, string> = {
  corNote: "Idea",
  apag: "Draft",
  offer: "Oferta",
  skill: "Skill",
  mvo: "Venta",
  content: "Contenido",
  trust: "Pieza",
  onePerson: "Visión",
  vaultNote: "Vault",
};

export type MentionSearchResult = {
  type: MentionType;
  typeLabel: string;
  /** number for DB-backed entities, string (vault relPath) for vaultNote */
  id: number | string;
  label: string;
  subtitle?: string;
};

/**
 * Search mentionable entities across all tables. `q` is free-text; matches by title/name.
 * Returns up to 20 results, oldest types last (notes first, vision last).
 */
export async function searchMentionsServer(q: string): Promise<MentionSearchResult[]> {
  const needle = `%${q.trim()}%`;
  const empty = !q.trim();
  const LIMIT_PER_TYPE = 5;

  const [
    notes,
    drafts,
    offerRows,
    skillRows,
    mvoRows,
    contentRows,
    trustRows,
    visionRows,
  ] = await Promise.all([
    db
      .select({ id: corNotes.id, title: corNotes.title })
      .from(corNotes)
      .where(empty ? undefined : ilike(corNotes.title, needle))
      .orderBy(desc(corNotes.createdAt))
      .limit(LIMIT_PER_TYPE),
    db
      .select({ id: apagDrafts.id, title: apagDrafts.title })
      .from(apagDrafts)
      .where(empty ? undefined : ilike(apagDrafts.title, needle))
      .orderBy(desc(apagDrafts.createdAt))
      .limit(LIMIT_PER_TYPE),
    db
      .select({ id: offers.id, name: offers.name, status: offers.status })
      .from(offers)
      .where(empty ? undefined : ilike(offers.name, needle))
      .orderBy(desc(offers.createdAt))
      .limit(LIMIT_PER_TYPE),
    db
      .select({ id: skills.id, name: skills.name, phase: skills.phase })
      .from(skills)
      .where(empty ? undefined : ilike(skills.name, needle))
      .orderBy(desc(skills.createdAt))
      .limit(LIMIT_PER_TYPE),
    db
      .select({
        id: mvoPipeline.id,
        prospectName: mvoPipeline.prospectName,
        stage: mvoPipeline.stage,
      })
      .from(mvoPipeline)
      .where(empty ? undefined : ilike(mvoPipeline.prospectName, needle))
      .orderBy(desc(mvoPipeline.updatedAt))
      .limit(LIMIT_PER_TYPE),
    db
      .select({
        id: contentPieces.id,
        title: contentPieces.title,
        type: contentPieces.type,
      })
      .from(contentPieces)
      .where(empty ? undefined : ilike(contentPieces.title, needle))
      .orderBy(desc(contentPieces.updatedAt))
      .limit(LIMIT_PER_TYPE),
    db
      .select({
        id: trustEntries.id,
        title: trustEntries.title,
        bucket: trustEntries.bucket,
      })
      .from(trustEntries)
      .where(empty ? undefined : ilike(trustEntries.title, needle))
      .orderBy(desc(trustEntries.createdAt))
      .limit(LIMIT_PER_TYPE),
    empty
      ? db.select({ id: onePersonVision.id, identity: onePersonVision.identity }).from(onePersonVision).limit(1)
      : db
          .select({ id: onePersonVision.id, identity: onePersonVision.identity })
          .from(onePersonVision)
          .where(
            or(
              ilike(onePersonVision.identity, needle),
              ilike(onePersonVision.problemISolve, needle)
            )
          )
          .limit(1),
  ]);

  const results: MentionSearchResult[] = [];

  for (const n of notes) {
    results.push({ type: "corNote", typeLabel: TYPE_LABELS.corNote, id: n.id, label: n.title });
  }
  for (const d of drafts) {
    results.push({ type: "apag", typeLabel: TYPE_LABELS.apag, id: d.id, label: d.title });
  }
  for (const o of offerRows) {
    results.push({
      type: "offer",
      typeLabel: TYPE_LABELS.offer,
      id: o.id,
      label: o.name,
      subtitle: o.status,
    });
  }
  for (const s of skillRows) {
    results.push({
      type: "skill",
      typeLabel: TYPE_LABELS.skill,
      id: s.id,
      label: s.name,
      subtitle: s.phase,
    });
  }
  for (const m of mvoRows) {
    results.push({
      type: "mvo",
      typeLabel: TYPE_LABELS.mvo,
      id: m.id,
      label: m.prospectName,
      subtitle: m.stage,
    });
  }
  for (const c of contentRows) {
    results.push({
      type: "content",
      typeLabel: TYPE_LABELS.content,
      id: c.id,
      label: c.title,
      subtitle: c.type,
    });
  }
  for (const t of trustRows) {
    results.push({
      type: "trust",
      typeLabel: TYPE_LABELS.trust,
      id: t.id,
      label: t.title,
      subtitle: t.bucket,
    });
  }
  for (const v of visionRows) {
    results.push({
      type: "onePerson",
      typeLabel: TYPE_LABELS.onePerson,
      id: v.id,
      label: v.identity || "Vision (sin título)",
    });
  }

  // Vault files — only if configured. Search across filenames + content.
  if (isVaultConfigured()) {
    try {
      const vaultHits = await searchVault(q, 8);
      for (const f of vaultHits) {
        // Show parent folder as subtitle so the user can disambiguate same-named notes
        const folder = f.relPath.includes("/")
          ? f.relPath.substring(0, f.relPath.lastIndexOf("/"))
          : "";
        results.push({
          type: "vaultNote",
          typeLabel: TYPE_LABELS.vaultNote,
          id: f.relPath,
          label: f.title,
          subtitle: folder || undefined,
        });
      }
    } catch {
      /* vault unreadable; skip silently */
    }
  }

  return results.slice(0, 25);
}

/**
 * Expand mentions into a textual context block to prepend to the user message.
 * Each mention's full data is fetched fresh from the DB so the LLM sees the
 * current state, not stale snapshots.
 */
export async function expandMentionsToContext(
  mentions: ChatMention[]
): Promise<string> {
  if (mentions.length === 0) return "";

  const byType: Record<MentionType, Array<number | string>> = {
    corNote: [],
    apag: [],
    offer: [],
    skill: [],
    mvo: [],
    content: [],
    trust: [],
    onePerson: [],
    vaultNote: [],
  };
  for (const m of mentions) byType[m.type].push(m.id);

  // Narrow helper for numeric ids
  const numIds = (key: MentionType) => byType[key].filter((id): id is number => typeof id === "number");
  const strIds = (key: MentionType) => byType[key].filter((id): id is string => typeof id === "string");

  const blocks: string[] = [];

  if (numIds("corNote").length) {
    const rows = await db
      .select()
      .from(corNotes)
      .where(inArray(corNotes.id, numIds("corNote")));
    for (const r of rows) {
      const parts: string[] = [];
      if (r.problem) parts.push(`Problem: ${r.problem}`);
      if (r.goal) parts.push(`Goal: ${r.goal}`);
      if (r.example) parts.push(`Example: ${r.example}`);
      if (r.benefit) parts.push(`Benefit: ${r.benefit}`);
      if (r.process) parts.push(`Process: ${r.process}`);
      if (r.concept) parts.push(`Concept: ${r.concept}`);
      blocks.push(
        `[@COR Note: "${r.title}"]\n${parts.join("\n") || "(sin contenido detallado)"}`
      );
    }
  }

  if (numIds("apag").length) {
    const rows = await db
      .select()
      .from(apagDrafts)
      .where(inArray(apagDrafts.id, numIds("apag")));
    for (const r of rows) {
      blocks.push(
        `[@APAG Draft: "${r.title}"]\nAtención: ${r.attention ?? "-"}\nPerspectiva: ${r.perspective ?? "-"}\nVentaja: ${r.advantage ?? "-"}\nGamificación: ${r.gamification ?? "-"}`
      );
    }
  }

  if (numIds("offer").length) {
    const rows = await db.select().from(offers).where(inArray(offers.id, numIds("offer")));
    for (const r of rows) {
      blocks.push(
        `[@Oferta: "${r.name}" — ${r.status}${r.priceUsd ? `, $${r.priceUsd}` : ""}]\nLimitación: ${r.limitation ?? "-"}\nMeta: ${r.goal ?? "-"}\nProceso: ${r.process ?? "-"}`
      );
    }
  }

  if (numIds("skill").length) {
    const rows = await db.select().from(skills).where(inArray(skills.id, numIds("skill")));
    for (const r of rows) {
      blocks.push(
        `[@Skill: "${r.name}" — fase ${r.phase}, revenue $${r.revenueUsd}]\nProyecto: ${r.project ?? "-"}\nNotas: ${r.notes ?? "-"}`
      );
    }
  }

  if (numIds("mvo").length) {
    const rows = await db
      .select()
      .from(mvoPipeline)
      .where(inArray(mvoPipeline.id, numIds("mvo")));
    for (const r of rows) {
      blocks.push(
        `[@MVO Prospect: "${r.prospectName}" — stage ${r.stage}, calls ${r.callsDone}/${r.callsTotal}${r.priceUsd ? `, $${r.priceUsd}` : ""}]\nNotas: ${r.notes ?? "-"}`
      );
    }
  }

  if (numIds("content").length) {
    const rows = await db
      .select()
      .from(contentPieces)
      .where(inArray(contentPieces.id, numIds("content")));
    for (const r of rows) {
      blocks.push(
        `[@Content: "${r.title}" — ${r.type}, status ${r.status}]\n${r.body ?? "(sin body)"}`
      );
    }
  }

  if (numIds("trust").length) {
    const rows = await db
      .select()
      .from(trustEntries)
      .where(inArray(trustEntries.id, numIds("trust")));
    for (const r of rows) {
      blocks.push(
        `[@Trust Entry: "${r.title}" — ${r.bucket}, ${r.date}]\nNotas: ${r.notes ?? "-"}`
      );
    }
  }

  if (numIds("onePerson").length) {
    const rows = await db.select().from(onePersonVision).limit(1);
    for (const r of rows) {
      blocks.push(
        `[@One Person Vision]\nIdentidad: ${r.identity ?? "-"}\nProblema que resuelvo: ${r.problemISolve ?? "-"}\nCliente ideal: ${r.idealCustomer ?? "-"}\nEmpaquetado: ${r.productizedSelf ?? "-"}`
      );
    }
  }

  // Vault notes — read each .md file on demand
  for (const relPath of strIds("vaultNote")) {
    try {
      const { content } = await readVaultFile(relPath);
      const title = relPath.split("/").pop()?.replace(/\.md$/i, "") ?? relPath;
      // Cap individual files at ~6k chars so context stays manageable
      const trimmed =
        content.length > 6000
          ? content.slice(0, 6000) + "\n\n[...truncado]"
          : content;
      blocks.push(`[@Obsidian: "${title}" (${relPath})]\n${trimmed}`);
    } catch {
      blocks.push(`[@Obsidian: "${relPath}"] (no se pudo leer el archivo)`);
    }
  }

  if (blocks.length === 0) return "";

  return `--- CONTEXTO DEL DASHBOARD (entidades mencionadas) ---\n\n${blocks.join("\n\n")}\n\n--- FIN CONTEXTO ---\n\n`;
}

// re-export for ergonomic imports
export { eq };
