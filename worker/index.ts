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
const DEFAULT_MODEL = "@cf/google/gemma-4-26b-a4b-it";
const FALLBACK_MODELS = ["@cf/zai-org/glm-4.7-flash", "@cf/qwen/qwen3-30b-a3b-fp8"];
const SMOKE_KEY = "cot-smoke-5d8f3a";

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
  if (typeof result === "string") return result.trim();
  if (!result || typeof result !== "object") return "";

  const record = result as Record<string, any>;

  if (typeof record.response === "string") return record.response.trim();
  if (typeof record.output_text === "string") return record.output_text.trim();
  if (typeof record.text === "string") return record.text.trim();
  if (typeof record.content === "string") return record.content.trim();

  const choices = record.choices;
  if (Array.isArray(choices)) {
    const content = choices[0]?.message?.content ?? choices[0]?.text;
    if (typeof content === "string") return content.trim();
    if (Array.isArray(content)) {
      const joined = content
        .map((part: any) => (typeof part?.text === "string" ? part.text : typeof part === "string" ? part : ""))
        .join("")
        .trim();
      if (joined) return joined;
    }
  }

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

function uniqueModels(primary?: string) {
  return [...new Set([primary || DEFAULT_MODEL, DEFAULT_MODEL, ...FALLBACK_MODELS].filter(Boolean))];
}

function errorDetail(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

async function runCouncilModel(env: Env, models: string[], messages: Message[], systemPrompt: string, requestId: string) {
  const failures: Array<{ model: string; detail: string }> = [];

  for (const model of models) {
    const startedAt = Date.now();
    try {
      const result = await env.AI.run(model as Parameters<Ai["run"]>[0], {
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_completion_tokens: 1800,
        temperature: 0.35,
      } as any);

      const raw = parseModelText(result);
      if (!raw) throw new Error("Model returned an empty or unrecognized response.");

      console.log(JSON.stringify({
        requestId,
        event: "council_model_success",
        model,
        latencyMs: Date.now() - startedAt,
        fallbackDepth: failures.length,
      }));

      return { raw, model, failures };
    } catch (error) {
      const detail = errorDetail(error);
      failures.push({ model, detail });
      console.error(JSON.stringify({
        requestId,
        event: "council_model_failure",
        model,
        latencyMs: Date.now() - startedAt,
        detail,
      }));
    }
  }

  throw Object.assign(new Error("All Council models failed."), { failures });
}

async function handleSmoke(env: Env) {
  const models = uniqueModels(env.COUNCIL_MODEL);
  const results: Array<Record<string, unknown>> = [];

  for (const model of models) {
    const startedAt = Date.now();
    try {
      const result = await env.AI.run(model as Parameters<Ai["run"]>[0], {
        messages: [
          { role: "system", content: "Reply with exactly OK." },
          { role: "user", content: "Health check." },
        ],
        max_completion_tokens: 16,
        temperature: 0,
      } as any);
      const text = parseModelText(result);
      results.push({
        model,
        ok: Boolean(text),
        text: text.slice(0, 40),
        latencyMs: Date.now() - startedAt,
      });
    } catch (error) {
      results.push({
        model,
        ok: false,
        error: errorDetail(error).slice(0, 500),
        latencyMs: Date.now() - startedAt,
      });
    }
  }

  return json({ ok: results.some((result) => result.ok === true), results });
}

async function handleCouncil(request: Request, env: Env) {
  const requestId = crypto.randomUUID().slice(0, 8);
  const body = (await request.json().catch(() => null)) as CouncilRequest | null;
  const messages = sanitizeMessages(body?.messages);

  if (!messages.length || messages[messages.length - 1]?.role !== "user") {
    return json({ error: "A user question is required.", requestId }, { status: 400 });
  }

  if (!env.AI) {
    console.error(JSON.stringify({ requestId, event: "missing_ai_binding" }));
    return json(
      { error: "The Council AI binding is unavailable. Please try again shortly.", requestId },
      { status: 503 },
    );
  }

  const combinedUserText = messages.filter((m) => m.role === "user").map((m) => m.content).join("\n");
  const sources = selectSources(combinedUserText);
  const phaseInstruction = continuationInstruction(body?.phase, body?.pauseQuestion);
  const systemPrompt = `${COUNCIL_SYSTEM_PROMPT}${phaseInstruction}\n\nALLOWED SOURCES\n${formatSourceContext(sources)}`;
  const models = uniqueModels(env.COUNCIL_MODEL);

  try {
    const { raw, model, failures } = await runCouncilModel(env, models, messages, systemPrompt, requestId);
    const parsed = extractPause(raw);

    return json({
      ...parsed,
      phase: body?.phase === "resume" ? "resume" : "open",
      sources: sources.map(({ tags: _tags, ...source }) => source),
      model,
      recoveredWithFallback: failures.length > 0,
      requestId,
    });
  } catch (error) {
    const failures = (error as any)?.failures as Array<{ model: string; detail: string }> | undefined;
    const details = failures?.map((failure) => failure.detail).join(" | ") || errorDetail(error);
    const quotaOrRate = /quota|limit|neurons|capacity|429|3040|5035|rate/i.test(details);

    console.error(JSON.stringify({ requestId, event: "council_all_models_failed", details }));

    return json(
      {
        error: quotaOrRate
          ? "The Council is temporarily at AI capacity. Please try again in a moment."
          : "The Council's AI service failed to answer. Please try again in a moment.",
        requestId,
      },
      { status: 503 },
    );
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "council-of-time",
        storage: "stateless",
        aiBinding: Boolean(env.AI),
        primaryModel: env.COUNCIL_MODEL || DEFAULT_MODEL,
        fallbackModels: FALLBACK_MODELS,
      });
    }

    if (url.pathname === "/api/_smoke" && request.method === "GET") {
      if (url.searchParams.get("key") !== SMOKE_KEY) return json({ error: "Not found" }, { status: 404 });
      return handleSmoke(env);
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
