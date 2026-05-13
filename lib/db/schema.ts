import {
  pgTable,
  text,
  integer,
  timestamp,
  date,
  numeric,
  serial,
  primaryKey,
  uniqueIndex,
  jsonb,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// =====================================================
// NextAuth (Auth.js) tables — required by @auth/drizzle-adapter
// =====================================================

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// =====================================================
// Dan Koe Frameworks — 10 tables
// =====================================================

// 1. Modelo de Una Sola Persona (singleton manifesto)
export const onePersonVision = pgTable("one_person_vision", {
  id: serial("id").primaryKey(),
  identity: text("identity"), // "Soy un X que ayuda a Y"
  problemISolve: text("problem_i_solve"),
  idealCustomer: text("ideal_customer"),
  productizedSelf: text("productized_self"), // qué producto/servicio empaqueta esto
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Ecosistema de Contenido (newsletter + derivados)
export const contentTypeEnum = pgEnum("content_type", [
  "newsletter",
  "x_thread",
  "x_short",
  "yt_script",
  "yt_short",
  "li_post",
]);
export const contentStatusEnum = pgEnum("content_status", [
  "idea",
  "draft",
  "scheduled",
  "published",
]);

export const contentPieces = pgTable("content_pieces", {
  id: serial("id").primaryKey(),
  type: contentTypeEnum("type").notNull(),
  title: text("title").notNull(),
  status: contentStatusEnum("status").notNull().default("idea"),
  parentId: integer("parent_id"), // self-ref: derivativo de un newsletter
  body: text("body"),
  publishedUrl: text("published_url"),
  pubDate: date("pub_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. Jornada Laboral de 4h (Llenar, Vaciar, Usar)
export const routineLog = pgTable(
  "routine_log",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    energyBlockStart: text("energy_block_start"), // "07:00"
    energyBlockEnd: text("energy_block_end"), // "11:00"
    walkMinutes: integer("walk_minutes").default(0).notNull(),
    totalWorkedMinutes: integer("total_worked_minutes").default(0).notNull(),
    deepWorkTask: text("deep_work_task"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("routine_log_date_unique").on(t.date)]
);

// 4. Marco APAG (Atención, Perspectiva, Ventaja, Gamificación)
export const apagDrafts = pgTable("apag_drafts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  attention: text("attention"), // ilustrar el problema
  perspective: text("perspective"), // cambiar marco mental
  advantage: text("advantage"), // mostrar beneficios
  gamification: text("gamification"), // proceso paso-a-paso
  finalOutput: text("final_output"), // texto compilado
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. COR Notes (Problem-Goal-Example-Benefit-Process-Concept)
export const corNotes = pgTable("cor_notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  problem: text("problem"),
  goal: text("goal"),
  example: text("example"),
  benefit: text("benefit"),
  process: text("process"),
  concept: text("concept"),
  sourceUrl: text("source_url"), // de qué libro/podcast/video viene
  sourceLabel: text("source_label"),
  obsidianPath: text("obsidian_path"), // vault relpath si fue importado de Obsidian
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Trust Matrix (Growth / Authority / Authenticity)
export const trustBucketEnum = pgEnum("trust_bucket", [
  "growth",
  "authority",
  "authenticity",
]);

export const trustEntries = pgTable("trust_entries", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  bucket: trustBucketEnum("bucket").notNull(),
  title: text("title").notNull(),
  contentPieceId: integer("content_piece_id"), // optional link to content_pieces
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 7. Ecuación de Valor → Ofertas
export const offerStatusEnum = pgEnum("offer_status", [
  "draft",
  "live",
  "paused",
  "retired",
]);

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  limitation: text("limitation"), // problema doloroso
  goal: text("goal"), // resultado final
  process: text("process"), // sistema creativo que cierra la brecha
  priceUsd: numeric("price_usd", { precision: 10, scale: 2 }),
  status: offerStatusEnum("status").notNull().default("draft"),
  pitch: text("pitch"), // texto compilado
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 8. Build / Teach / Earn
export const skillPhaseEnum = pgEnum("skill_phase", ["build", "teach", "earn"]);

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phase: skillPhaseEnum("phase").notNull().default("build"),
  project: text("project"), // proyecto donde la aplicás
  contentLinks: jsonb("content_links").$type<string[]>().default([]).notNull(),
  revenueUsd: numeric("revenue_usd", { precision: 10, scale: 2 }).default("0").notNull(),
  startedAt: date("started_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 9. MVO Pipeline (Oferta Mínima Viable — 4 calls / $500-1000)
export const mvoStageEnum = pgEnum("mvo_stage", [
  "prospect",
  "call_scheduled",
  "sold",
  "delivering",
  "done",
  "lost",
]);

export const mvoPipeline = pgTable("mvo_pipeline", {
  id: serial("id").primaryKey(),
  prospectName: text("prospect_name").notNull(),
  prospectContact: text("prospect_contact"),
  offerId: integer("offer_id").references(() => offers.id, { onDelete: "set null" }),
  stage: mvoStageEnum("stage").notNull().default("prospect"),
  callsDone: integer("calls_done").default(0).notNull(),
  callsTotal: integer("calls_total").default(4).notNull(),
  priceUsd: numeric("price_usd", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// =====================================================
// Chat — Dan Koe persona assistant
// =====================================================

export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);

export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default("Nueva conversación"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  archived: boolean("archived").default(false).notNull(),
});

export type ChatMention = {
  type:
    | "corNote"
    | "apag"
    | "offer"
    | "skill"
    | "mvo"
    | "content"
    | "trust"
    | "onePerson"
    | "vaultNote";
  /** Numeric DB id for db-backed entities; relPath string for vaultNote */
  id: number | string;
  label: string;
};

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => chatConversations.id, { onDelete: "cascade" }),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  mentions: jsonb("mentions").$type<ChatMention[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  editedAt: timestamp("edited_at"),
});

export type ChatConversation = typeof chatConversations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;

// =====================================================
// 10. Ley de Koe (time vs revenue — $/hora)
// =====================================================
export const timeLog = pgTable(
  "time_log",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    hoursWorked: numeric("hours_worked", { precision: 5, scale: 2 }).notNull(),
    revenueUsd: numeric("revenue_usd", { precision: 10, scale: 2 }).default("0").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("time_log_date_unique").on(t.date)]
);

// =====================================================
// Re-exports for convenience
// =====================================================

export type User = typeof users.$inferSelect;
export type CorNote = typeof corNotes.$inferSelect;
export type RoutineLog = typeof routineLog.$inferSelect;
export type ApagDraft = typeof apagDrafts.$inferSelect;
export type ContentPiece = typeof contentPieces.$inferSelect;
export type TrustEntry = typeof trustEntries.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type MvoEntry = typeof mvoPipeline.$inferSelect;
export type TimeLogEntry = typeof timeLog.$inferSelect;
export type OnePersonVision = typeof onePersonVision.$inferSelect;
