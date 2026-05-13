import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  date,
  timestamp,
} from "drizzle-orm/pg-core";

// ── Goals ─────────────────────────────────────────────────────────────────────

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  result: text("result"),    // ¿Qué resultado específico quiero?
  purpose: text("purpose"),  // ¿Por qué importa?
  status: text("status").notNull().default("active"),    // not_started | active | completed | paused
  horizon: text("horizon").notNull().default("90days"),  // 90days | 1year | 3year | lifetime
  deadline: date("deadline"),
  progress: integer("progress").default(0),  // 0-100
  position: integer("position").default(0),
  // SMART fields
  smartSpecific: text("smart_specific"),
  smartMeasurable: text("smart_measurable"),
  smartAchievable: text("smart_achievable"),
  smartRelevant: text("smart_relevant"),
  smartTimeBound: text("smart_time_bound"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  goalId: integer("goal_id"),  // nullable — tasks can exist without a goal
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"),      // todo | in_progress | done | blocked
  priority: text("priority").notNull().default("medium"), // high | medium | low
  deadline: date("deadline"),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

// ── Focus Sessions ────────────────────────────────────────────────────────────

export const focusSessions = pgTable("focus_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  goalId: integer("goal_id"),
  taskId: integer("task_id"),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  breakMinutes: integer("break_minutes").default(0),
  completed: boolean("completed").default(false),
  notes: text("notes"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

export type FocusSession = typeof focusSessions.$inferSelect;
export type NewFocusSession = typeof focusSessions.$inferInsert;

// ── Milestones ────────────────────────────────────────────────────────────────

export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  goalId: integer("goal_id").notNull(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Milestone = typeof milestones.$inferSelect;
export type NewMilestone = typeof milestones.$inferInsert;
