import { streamText, convertToModelMessages } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { messages, goalContext } = body;

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: `Sos un AI Coach personal de productividad y claridad estratégica.
Conocés todos los goals y tareas del usuario. Tu rol es ayudar a priorizar, clarificar, dar perspectiva y motivar la acción.

Contexto de goals activos:
${goalContext ?? ""}

Principios:
- Sé directo y accionable. No des respuestas genéricas.
- Preguntá "¿cuál es el siguiente paso concreto?" cuando el usuario esté bloqueado.
- Usá la metodología RPM: Result, Purpose, Massive Action Plan.
- Ayudá a identificar las tareas de mayor apalancamiento.
- Sé honesto si un goal parece ambiguo o poco accionable.`,
    messages: await convertToModelMessages(messages ?? []),
  });

  return result.toUIMessageStreamResponse();
}
