import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  timestamp,
  date,
  numeric,
  jsonb,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ── Enums ────────────────────────────────────────────────────────────────────

export const contentStatusEnum = pgEnum("content_status", [
  "idea",
  "draft",
  "scheduled",
  "published",
]);
export const contentTypeEnum = pgEnum("content_type", [
  "newsletter",
  "x_thread",
  "x_short",
  "yt_script",
  "yt_short",
  "li_post",
]);
export const mvoStageEnum = pgEnum("mvo_stage", [
  "prospect",
  "call_scheduled",
  "sold",
  "delivering",
  "done",
  "lost",
]);
export const offerStatusEnum = pgEnum("offer_status", [
  "draft",
  "live",
  "paused",
  "retired",
]);
export const skillPhaseEnum = pgEnum("skill_phase", ["build", "teach", "earn"]);
export const trustBucketEnum = pgEnum("trust_bucket", [
  "growth",
  "authority",
  "authenticity",
]);

// ── Auth.js tables ────────────────────────────────────────────────────────────

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified"),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
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
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires").notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

// ── Framework tables ──────────────────────────────────────────────────────────

export const onePerson = pgTable("one_person_vision", {
  id: serial("id").primaryKey(),
  identity: text("identity"),
  problemISolve: text("problem_i_solve"),
  idealCustomer: text("ideal_customer"),
  productizedSelf: text("productized_self"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const routineLog = pgTable(
  "routine_log",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    energyBlockStart: text("energy_block_start"),
    energyBlockEnd: text("energy_block_end"),
    walkMinutes: integer("walk_minutes").default(0).notNull(),
    totalWorkedMinutes: integer("total_worked_minutes").default(0).notNull(),
    deepWorkTask: text("deep_work_task"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("routine_log_date_unique").on(t.date)]
);

export const contentPieces = pgTable("content_pieces", {
  id: serial("id").primaryKey(),
  type: contentTypeEnum("type").notNull(),
  title: text("title").notNull(),
  status: contentStatusEnum("status").default("idea").notNull(),
  parentId: integer("parent_id"),
  body: text("body"),
  publishedUrl: text("published_url"),
  pubDate: date("pub_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const corNotes = pgTable("cor_notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  problem: text("problem"),
  goal: text("goal"),
  example: text("example"),
  benefit: text("benefit"),
  process: text("process"),
  concept: text("concept"),
  sourceUrl: text("source_url"),
  sourceLabel: text("source_label"),
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const apagDrafts = pgTable("apag_drafts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  attention: text("attention"),
  perspective: text("perspective"),
  advantage: text("advantage"),
  gamification: text("gamification"),
  finalOutput: text("final_output"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trustEntries = pgTable("trust_entries", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  bucket: trustBucketEnum("bucket").notNull(),
  title: text("title").notNull(),
  contentPieceId: integer("content_piece_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phase: skillPhaseEnum("phase").default("build").notNull(),
  project: text("project"),
  contentLinks: jsonb("content_links").$type<string[]>().default([]).notNull(),
  revenueUsd: numeric("revenue_usd", { precision: 10, scale: 2 }).default("0").notNull(),
  startedAt: date("started_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  limitation: text("limitation"),
  goal: text("goal"),
  process: text("process"),
  priceUsd: numeric("price_usd", { precision: 10, scale: 2 }),
  status: offerStatusEnum("status").default("draft").notNull(),
  pitch: text("pitch"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mvoPipeline = pgTable("mvo_pipeline", {
  id: serial("id").primaryKey(),
  prospectName: text("prospect_name").notNull(),
  prospectContact: text("prospect_contact"),
  offerId: integer("offer_id").references(() => offers.id, { onDelete: "set null" }),
  stage: mvoStageEnum("stage").default("prospect").notNull(),
  callsDone: integer("calls_done").default(0).notNull(),
  callsTotal: integer("calls_total").default(4).notNull(),
  priceUsd: numeric("price_usd", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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

export type OnePersonVision = typeof onePerson.$inferSelect;
export type RoutineLog = typeof routineLog.$inferSelect;
export type ContentPiece = typeof contentPieces.$inferSelect;
export type CorNote = typeof corNotes.$inferSelect;
export type ApagDraft = typeof apagDrafts.$inferSelect;
export type TrustEntry = typeof trustEntries.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type MvoEntry = typeof mvoPipeline.$inferSelect;
export type TimeLogEntry = typeof timeLog.$inferSelect;
