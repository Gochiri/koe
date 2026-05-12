import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db/client";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/lib/db/schema";
import { env } from "@/lib/env";

/**
 * Auth.js v5 config — magic-link single-user dashboard.
 *
 * Email transport:
 *  - If `AUTH_RESEND_KEY` is a real key (starts with `re_` and >10 chars), use Resend.
 *  - Otherwise (dev / no-resend mode), `sendVerificationRequest` just prints the magic link
 *    to the server console so you can copy-paste it into the browser. No email service required.
 *
 * Session strategy: database (required for email/magic-link provider).
 * Whitelist: only env.ALLOWED_EMAIL can sign in (rejected in `signIn` callback).
 */
const resendKeyLooksReal =
  env.AUTH_RESEND_KEY &&
  env.AUTH_RESEND_KEY.startsWith("re_") &&
  env.AUTH_RESEND_KEY.length > 10 &&
  !env.AUTH_RESEND_KEY.includes("xxxx");

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  providers: [
    Resend({
      apiKey: env.AUTH_RESEND_KEY || "noop",
      from: env.AUTH_EMAIL_FROM,
      // Override the network send when the key isn't real → print to console.
      ...(resendKeyLooksReal
        ? {}
        : {
            async sendVerificationRequest({ identifier, url }) {
              // eslint-disable-next-line no-console
              console.log(
                "\n" +
                  "═══════════════════════════════════════════════════════════\n" +
                  "  🪄  MAGIC LINK (no Resend configured — copy & open)\n" +
                  "═══════════════════════════════════════════════════════════\n" +
                  `  to:   ${identifier}\n` +
                  `  url:  ${url}\n` +
                  "═══════════════════════════════════════════════════════════\n"
              );
            },
          }),
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
  },
  callbacks: {
    async signIn({ user }) {
      // Hard whitelist: only ALLOWED_EMAIL can ever log in.
      if (user.email?.toLowerCase() !== env.ALLOWED_EMAIL.toLowerCase()) {
        return false;
      }
      return true;
    },
    async session({ session, user }) {
      // Expose user id on the session for server actions.
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
