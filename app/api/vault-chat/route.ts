import { streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { messages, boardContext } = await req.json();

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: `Sos un asistente de escritura y estrategia de contenido.
Tenés acceso al contenido del board del usuario. Usá ese contexto para ayudar a escribir, expandir ideas, generar títulos, transformar notas en posts, o responder cualquier pregunta.

Contenido del board:
${boardContext}`,
    messages,
  });

  return result.toDataStreamResponse();
}
