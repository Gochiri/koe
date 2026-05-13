import { z } from "zod";

/**
 * Validated environment variables.
 *
 * Add new envs by extending the schema below. Importing this module
 * throws at startup if any required var is missing/invalid — fail fast.
 */
const envSchema = z.object({
  // --- Database ---
  DATABASE_URL: z
    .string()
    .url()
    .describe("Postgres connection string. Local default in docker-compose.yml."),

  // --- NextAuth (Auth.js v5) ---
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 chars. Generate with: openssl rand -base64 32"),
  AUTH_URL: z.string().url().optional(),

  // --- Magic-link email provider (Resend) ---
  // Optional: if absent or placeholder, magic links print to the dev console instead.
  AUTH_RESEND_KEY: z.string().optional().default(""),
  AUTH_EMAIL_FROM: z
    .string()
    .min(1)
    .default("noreply@localhost")
    .describe("From-address for magic-link emails. Only matters when Resend is configured."),

  // --- Single-user whitelist ---
  ALLOWED_EMAIL: z
    .string()
    .email("ALLOWED_EMAIL must be a valid email — only this address can log in"),

  // --- Anthropic Claude API (optional — chat feature is disabled if absent) ---
  ANTHROPIC_API_KEY: z.string().optional().default(""),

  // --- Obsidian vault (optional — vault features disabled if absent) ---
  // Absolute path to the vault's root folder. The dev server reads .md files from here.
  OBSIDIAN_VAULT_PATH: z.string().optional().default(""),

  // --- Node env ---
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment — see logs above.");
}

export const env = parsed.data;
