// Legacy chat module — not used in current nav. Stubbed to prevent build errors.
"use server";

export async function createConversation(): Promise<number> { return 0; }
export async function renameConversation() {}
export async function deleteConversation() {}
export async function listConversations() { return []; }
export async function loadConversationMessages() { return []; }
export async function editMessage() {}
export async function deleteMessage() {}
export async function searchMentions() { return []; }
export async function sendMessage(): Promise<never> {
  throw new Error("Legacy chat not available.");
}
