CREATE TYPE "public"."content_status" AS ENUM('idea', 'draft', 'scheduled', 'published');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('newsletter', 'x_thread', 'x_short', 'yt_script', 'yt_short', 'li_post');--> statement-breakpoint
CREATE TYPE "public"."mvo_stage" AS ENUM('prospect', 'call_scheduled', 'sold', 'delivering', 'done', 'lost');--> statement-breakpoint
CREATE TYPE "public"."offer_status" AS ENUM('draft', 'live', 'paused', 'retired');--> statement-breakpoint
CREATE TYPE "public"."skill_phase" AS ENUM('build', 'teach', 'earn');--> statement-breakpoint
CREATE TYPE "public"."trust_bucket" AS ENUM('growth', 'authority', 'authenticity');--> statement-breakpoint
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "apag_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"attention" text,
	"perspective" text,
	"advantage" text,
	"gamification" text,
	"final_output" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_pieces" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "content_type" NOT NULL,
	"title" text NOT NULL,
	"status" "content_status" DEFAULT 'idea' NOT NULL,
	"parent_id" integer,
	"body" text,
	"published_url" text,
	"pub_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cor_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"problem" text,
	"goal" text,
	"example" text,
	"benefit" text,
	"process" text,
	"concept" text,
	"source_url" text,
	"source_label" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mvo_pipeline" (
	"id" serial PRIMARY KEY NOT NULL,
	"prospect_name" text NOT NULL,
	"prospect_contact" text,
	"offer_id" integer,
	"stage" "mvo_stage" DEFAULT 'prospect' NOT NULL,
	"calls_done" integer DEFAULT 0 NOT NULL,
	"calls_total" integer DEFAULT 4 NOT NULL,
	"price_usd" numeric(10, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"limitation" text,
	"goal" text,
	"process" text,
	"price_usd" numeric(10, 2),
	"status" "offer_status" DEFAULT 'draft' NOT NULL,
	"pitch" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "one_person_vision" (
	"id" serial PRIMARY KEY NOT NULL,
	"identity" text,
	"problem_i_solve" text,
	"ideal_customer" text,
	"productized_self" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routine_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"energy_block_start" text,
	"energy_block_end" text,
	"walk_minutes" integer DEFAULT 0 NOT NULL,
	"total_worked_minutes" integer DEFAULT 0 NOT NULL,
	"deep_work_task" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phase" "skill_phase" DEFAULT 'build' NOT NULL,
	"project" text,
	"content_links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"revenue_usd" numeric(10, 2) DEFAULT '0' NOT NULL,
	"started_at" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"hours_worked" numeric(5, 2) NOT NULL,
	"revenue_usd" numeric(10, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trust_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"bucket" "trust_bucket" NOT NULL,
	"title" text NOT NULL,
	"content_piece_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mvo_pipeline" ADD CONSTRAINT "mvo_pipeline_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "routine_log_date_unique" ON "routine_log" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "time_log_date_unique" ON "time_log" USING btree ("date");