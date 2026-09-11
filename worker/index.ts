import { COUNCIL_SYSTEM_PROMPT, formatSourceContext } from "./prompt";
import { selectSources } from "./sources";

type Message = { role: "user" | "assistant"; content: string };

type CouncilRequest = {
  messages?: unknown;
  phase?: unknown;
  pauseQuestion?: unknown;
};

interface Env {
  AI: Ai;
  ASSETS: Fetcher;
  COUNCIL_MODEL?: string;
}

const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 8000;

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });
}

function sanitizeMessages(value: unknown): Message[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Message => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<Message>;
      return (candidate.role === "user" || candidate.role === "assistant") && typeof candidate.content === "string";
    })
    .slice(-MAX_MESSAGES)
    .map((message) => ({ ...message, content: message.content.slice(0, MAX_MESSAGE_CHARS) }));
}

function parseModelText(result: unknown): string {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") return "";
  const record = result as Record<string, any>;
  if (typeof record.response === "string") return record.response;
  const choices = record.choices;
  if (Array.isArray(choices) && typeof choices[0]?.message?.content === "string") return choices[0].message.content;
  return "";
}

function extractPause(answer: string) {
  const match = answer.match(/(?:^|\n)PAUSE_QUESTION:\s*(.+?)\s*$/s);
  if (!match) return { answer: answer.trim(), pause: null };
  const cleaned = answer.replace(/(?:^|\n)PAUSE_QUESTION:\s*(.+?)\s*$/s, "").trim();
  return { answer: cleaned, pause: { question: match[1].trim() } };
}

function continuationInstruction(phase: unknown, pauseQuestion: unknown) {
  if (phase !== "resume" || typeof pauseQuestion !== "string" || !pauseQuestion.trim()) return "";
  return `\n\nCONTINUATION STATE\nThe user is answering the table's prior fault-line question:\n${pauseQuestion.trim()}\n\nTreat the user's latest message as an answer to that question. Resume the existing deliberation instead of restarting it. Carry the answer through the competing frameworks, then normally proceed to Bourdain's Read, Where This Meets You when relevant, and a Council Finding. Do not ask another PAUSE_QUESTION unless the new answer genuinely creates a different decisive fault line that must be resolved before synthesis.`;
}

async function handleCouncil(request: Request, env: Env) {
  const body = await request.json().catch(() => null) as CouncilRequest | null;
  const messages = sanitizeMessages(body?.messages);
  if (!messages.length || messages[messages.length - 1]?.role !== "user") {
    return json({ error: "A user question is required." }, { status: 400 });
  }

  const combinedUserText = messages.filter((m) => m.role === "user").map((m) => m.content).join("\n");
  const sources = selectSources(combinedUserText);
  const model = env.COUNCIL_MODEL || "@cf/google/gemma-4-26b-a4b-it";
  const phaseInstruction = continuationInstruction(body?.phase, body?.pauseQuestion);

  try {
    const result = await env.AI.run(model as Parameters<Ai["run"]>[0], {
      messages: [
        {
          role: "system",
          content: `${COUNCIL_SYSTEM_PROMPT}${phaseInstruction}\n\nALLOWED SOURCES\n${formatSourceContext(sources)}`,
        },
        ...messages,
      ],
      max_tokens: 1800,
      temperature: 0.35,
    } as any);

    const raw = parseModelText(result);
    if (!raw) throw new Error("The model returned an empty response.");
    const parsed = extractPause(raw);

    return json({
      ...parsed,
      phase: body?.phase === "resume" ? "resume" : "open",
      sources: sources.map(({ tags: _tags, ...source }) => source),
      model,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const quota = /quota|limit|neurons|capacity|429|3040|5035|403/i.test(detail);
    return json(
      {
        error: quota
          ? "The Council has reached today's free inference allowance. It will reopen automatically when Cloudflare's daily allowance resets."
          : "The Council could not convene just now. Please try again.",
      },
      { status: quota ? 429 : 500 },
    );
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "council-of-time", storage: "stateless" });
    }

    if (url.pathname === "/api/council" && request.method === "POST") {
      return handleCouncil(request, env);
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "Not found" }, { status: 404 });
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
