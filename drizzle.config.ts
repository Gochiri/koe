import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load .env.local so drizzle-kit CLI sees the same env as the app
config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
