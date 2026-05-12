import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const vaultBoards = pgTable("vault_boards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vaultSections = pgTable("vault_sections", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id")
    .notNull()
    .references(() => vaultBoards.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: integer("position").default(0).notNull(),
});

export const vaultItems = pgTable("vault_items", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id")
    .notNull()
    .references(() => vaultBoards.id, { onDelete: "cascade" }),
  sectionId: integer("section_id").references(() => vaultSections.id, {
    onDelete: "set null",
  }),
  kind: text("kind").notNull().default("card"),
  title: text("title"),
  body: text("body"),
  position: integer("position").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type VaultBoard = typeof vaultBoards.$inferSelect;
export type VaultSection = typeof vaultSections.$inferSelect;
export type VaultItem = typeof vaultItems.$inferSelect;
