CREATE TABLE "vault_boards" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vault_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"board_id" integer NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vault_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"board_id" integer NOT NULL,
	"section_id" integer,
	"kind" text DEFAULT 'card' NOT NULL,
	"title" text,
	"body" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vault_sections" ADD CONSTRAINT "vault_sections_board_id_vault_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."vault_boards"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "vault_items" ADD CONSTRAINT "vault_items_board_id_vault_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."vault_boards"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "vault_items" ADD CONSTRAINT "vault_items_section_id_vault_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."vault_sections"("id") ON DELETE set null ON UPDATE no action;
