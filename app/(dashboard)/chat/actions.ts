// @ts-nocheck — legacy chat module, not used in current nav
"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import {
  chatConversations,
  chatMessages,
  type ChatMention,
  type ChatMessage,
} from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropic, CHAT_MODEL, CHAT_MAX_TOKENS } from "@/lib/chat/anthropic";
import { buildDanKoeSystemPrompt } from "@/lib/chat/system-prompt";
import {
  expandMentionsToContext,
  searchMentionsServer,
  type MentionSearchResult,
} from "@/lib/chat/mentions";

async function requireSession() {
  const s = await auth();
  if (!s?.user) throw new Error("Unauthorized");
}

// =====================================================
// Conversation CRUD
// =====================================================

export async function createConversation(title?: string): Promise<number> {
  await requireSession();
  const [row] = await db
    .insert(chatConversations)
    .values({ title: title?.trim() || "Nueva conversación" })
    .returning({ id: chatConversations.id });
  revalidatePath("/", "layout");
  return row.id;
}

export async function renameConversation(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  const title = formData.get("title")?.toString().trim() || "Sin título";
  if (!Number.isFinite(id)) throw new Error("Invalid id");
  await db
    .update(chatConversations)
    .set({ title, updatedAt: new Date() })
    .where(eq(chatConversations.id, id));
  revalidatePath("/", "layout");
}

export async function deleteConversation(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("Invalid id");
  await db.delete(chatConversations).where(eq(chatConversations.id, id));
  revalidatePath("/", "layout");
}

export async function listConversations() {
  await requireSession();
  return db
    .select()
    .from(chatConversations)
    .where(eq(chatConversations.archived, false))
    .orderBy(desc(chatConversations.updatedAt))
    .limit(50);
}

export async function loadConversationMessages(conversationId: number) {
  await requireSession();
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(asc(chatMessages.createdAt));
}

// =====================================================
// Message CRUD
// =====================================================

export async function editMessage(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  const content = formData.get("content")?.toString().trim() ?? "";
  if (!Number.isFinite(id)) throw new Error("Invalid id");
  if (!content) throw new Error("Mensaje vacío");
  await db
    .update(chatMessages)
    .set({ content, editedAt: new Date() })
    .where(eq(chatMessages.id, id));
  revalidatePath("/", "layout");
}

export async function deleteMessage(formData: FormData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("Invalid id");
  await db.delete(chatMessages).where(eq(chatMessages.id, id));
  revalidatePath("/", "layout");
}

// =====================================================
// Mention search
// =====================================================

export async function searchMentions(q: string): Promise<MentionSearchResult[]> {
  await requireSession();
  return searchMentionsServer(q);
}

// =====================================================
// Send message → Claude → store assistant reply
// =====================================================

const sendMessageSchema = z.object({
  conversationId: z.number().int(),
  text: z.string().min(1).max(8000),
  mentions: z
    .array(
      z.object({
        type: z.enum([
          "corNote",
          "apag",
          "offer",
          "skill",
          "mvo",
          "content",
          "trust",
          "onePerson",
          "vaultNote",
        ]),
        // number for DB rows; string (vault relPath) for vaultNote
        id: z.union([z.number().int(), z.string().min(1).max(500)]),
        label: z.string(),
      })
    )
    .max(20)
    .default([]),
});

export type SendMessageResult = {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  cacheStats?: { read: number; written: number };
};

export async function sendMessage(input: {
  conversationId: number;
  text: string;
  mentions: ChatMention[];
}): Promise<SendMessageResult> {
  await requireSession();
  const parsed = sendMessageSchema.parse(input);

  // 1. Persist user message
  const [userMsg] = await db
    .insert(chatMessages)
    .values({
      conversationId: parsed.conversationId,
      role: "user",
      content: parsed.text,
      mentions: parsed.mentions,
    })
    .returning();

  // 2. Load full conversation history (oldest first)
  const history = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, parsed.conversationId))
    .orderBy(asc(chatMessages.createdAt));

  // 3. Build Anthropic messages array.
  //    For the LATEST user message we prepend mention context. Older messages
  //    keep their stored content as-is so the prefix stays cacheable across turns.
  const latestUserId = userMsg.id;

  const messages: Anthropic.MessageParam[] = await Promise.all(
    history.map(async (m): Promise<Anthropic.MessageParam> => {
      if (m.id === latestUserId && m.mentions.length > 0) {
        const ctx = await expandMentionsToContext(m.mentions);
        return { role: m.role, content: `${ctx}${m.content}` };
      }
      return { role: m.role, content: m.content };
    })
  );

  // 4. Call Claude with cached system prompt
  const client = getAnthropic();
  let assistantText = "";
  let cacheRead = 0;
  let cacheWritten = 0;

  try {
    const response = await client.messages.create({
      model: CHAT_MODEL,
      max_tokens: CHAT_MAX_TOKENS,
      system: [
        {
          type: "text",
          text: buildDanKoeSystemPrompt(),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages,
    });

    for (const block of response.content) {
      if (block.type === "text") assistantText += block.text;
    }
    cacheRead = response.usage.cache_read_input_tokens ?? 0;
    cacheWritten = response.usage.cache_creation_input_tokens ?? 0;
  } catch (err) {
    // Rollback the user message so the conversation isn't left in a half-state
    await db.delete(chatMessages).where(eq(chatMessages.id, userMsg.id));

    if (err instanceof Anthropic.RateLimitError) {
      throw new Error("Rate limit de Anthropic. Esperá un momento e intentá de nuevo.");
    }
    if (err instanceof Anthropic.AuthenticationError) {
      throw new Error("ANTHROPIC_API_KEY inválida.");
    }
    if (err instanceof Anthropic.APIError) {
      throw new Error(`Anthropic ${err.status}: ${err.message}`);
    }
    throw err;
  }

  // 5. Persist assistant reply
  const [assistantMsg] = await db
    .insert(chatMessages)
    .values({
      conversationId: parsed.conversationId,
      role: "assistant",
      content: assistantText || "(respuesta vacía)",
    })
    .returning();

  // 6. Bump conversation updatedAt + auto-title from first user msg
  if (history.length === 1) {
    const autoTitle = parsed.text.slice(0, 60);
    await db
      .update(chatConversations)
      .set({ title: autoTitle, updatedAt: new Date() })
      .where(eq(chatConversations.id, parsed.conversationId));
  } else {
    await db
      .update(chatConversations)
      .set({ updatedAt: new Date() })
      .where(eq(chatConversations.id, parsed.conversationId));
  }

  revalidatePath("/", "layout");

  return {
    userMessage: userMsg,
    assistantMessage: assistantMsg,
    cacheStats: { read: cacheRead, written: cacheWritten },
  };
}
