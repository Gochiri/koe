import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  AUTH_RESEND_KEY: z.string().default("re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"),
  AUTH_EMAIL_FROM: z.string().default("onboarding@resend.dev"),
  ALLOWED_EMAIL: z.string().min(1),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);
