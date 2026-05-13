// Legacy chat module — stubbed out. @anthropic-ai/sdk is not installed.
// Active AI uses @ai-sdk/anthropic via the Vercel AI SDK (goals-chat, vault-chat routes).

export function getAnthropic(): never {
  throw new Error("Legacy chat not available — use /api/goals-chat instead.");
}

export const CHAT_MODEL = "claude-sonnet-4-5";
export const CHAT_MAX_TOKENS = 4096;
