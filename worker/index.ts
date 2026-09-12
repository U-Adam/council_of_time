import { COUNCIL_SYSTEM_PROMPT, formatSourceContext } from "./prompt";
import { ARTIST_SOURCE_CATALOG } from "./artistSources";
import { ARTIST_WITNESS_IDS, ensureArtistWitness } from "./artistWitness";
import { selectSources, SOURCE_CATALOG, type PublicSource } from "./sources";
import { createTablePlan } from "./tablePlan";

type Message = { role: "user" | "assistant"; content: string };

type CouncilRequest = {
  messages?: unknown;
  phase?: unknown;
  pauseQuestion?: unknown;
  sourceIds?: unknown;
};

interface Env {
  AI: Ai;
  ASSETS: Fetcher;
  COUNCIL_MODEL?: string;
  CF_VERSION_METADATA?: WorkerVersionMetadata;
}

const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 8000;
const DEFAULT_MODEL = "@cf/google/gemma-4-26b-a4b-it";
const FALLBACK_MODELS = ["@cf/zai-org/glm-4.7-flash", "@cf/meta/llama-3.1-8b-instruct-fast"];
const ALL_SOURCE_CATALOG = [...SOURCE_CATALOG, ...ARTIST_SOURCE_CATALOG];
const SOURCE_BY_ID = new Map(ALL_SOURCE_CATALOG.map((source) => [source.id, source]));

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

function sanitizeSourceIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && /^S\d+$/.test(item)))].slice(0, 12);
}

function resolveSources(ids: string[]): PublicSource[] {
  return ids.map((id) => SOURCE_BY_ID.get(id)).filter((source): source is PublicSource => Boolean(source));
}

export function parseModelText(result: unknown): string {
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

function finishReason(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const record = result as Record<string, any>;
  const reason = Array.isArray(record.choices) ? record.choices[0]?.finish_reason : null;
  return typeof reason === "string" ? reason : null;
}

export function extractPause(answer: string) {
  const match = answer.match(/(?:^|\n)PAUSE_QUESTION:\s*(.+?)\s*$/s);
  if (!match) return { answer: answer.trim(), pause: null };
  const cleaned = answer.replace(/(?:^|\n)PAUSE_QUESTION:\s*(.+?)\s*$/s, "").trim();
  return { answer: cleaned, pause: { question: match[1].trim() } };
}

export function continuationInstruction(phase: unknown, pauseQuestion: unknown) {
  if (phase !== "resume" || typeof pauseQuestion !== "string" || !pauseQuestion.trim()) return "";
  return `\n\nCONTINUATION STATE\nThe user is answering the table's prior fault-line question:\n${pauseQuestion.trim()}\n\nTreat the user's latest message as an answer to that question. Resume the existing deliberation instead of restarting it. Keep the existing table and source roster unless the user's answer itself makes one of those voices irrelevant. Carry the answer through the competing frameworks, then normally proceed to Bourdain's Read, Where This Meets You when relevant, and a Council Finding. Do not ask another PAUSE_QUESTION unless the new answer genuinely creates a different decisive fault line that must be resolved before synthesis.`;
}

export function ensureArtistWitnessBadge(answer: string, sources: PublicSource[]) {
  if (answer.includes("`Artist Witness`")) return answer;

  const artistSource = sources.find((source) => ARTIST_WITNESS_IDS.has(source.id));
  if (!artistSource) return answer;
  const artistName = artistSource.title.split(" — ")[0]?.trim();
  if (!artistName) return answer;

  const lines = answer.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trimStart().startsWith("|")) continue;
    const cells = line.split("|");
    if (cells.length < 4 || !cells[1]?.includes(artistName)) continue;

    const boldName = `**${artistName}**`;
    if (cells[1].includes(boldName)) {
      cells[1] = cells[1].replace(boldName, `${boldName} \`Artist Witness\``);
    } else {
      cells[1] = cells[1].replace(artistName, `${artistName} \`Artist Witness\``);
    }
    lines[index] = cells.join("|");
    return lines.join("\n");
  }

  return answer;
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

export function generationOptions(model: string, maxTokens: number, temperature: number) {
  if (model === "@cf/meta/llama-3.1-8b-instruct-fast") {
    return {
      max_tokens: maxTokens,
      temperature,
    };
  }

  return {
    max_completion_tokens: maxTokens,
    temperature,
    chat_template_kwargs: {
      enable_thinking: false,
    },
  };
}

export function invalidCitationIds(answer: string, allowedSourceIds: Set<string>) {
  const cited = [...answer.matchAll(/\[(S\d+)\]/g)].map((match) => match[1]);
  return [...new Set(cited.filter((id) => !allowedSourceIds.has(id)))];
}

async function runCouncilModel(
  env: Env,
  models: string[],
  messages: Message[],
  systemPrompt: string,
  allowedSourceIds: Set<string>,
  requestId: string,
) {
  const failures: Array<{ model: string; detail: string }> = [];

  for (const model of models) {
    const startedAt = Date.now();
    try {
      const result = await env.AI.run(model as Parameters<Ai["run"]>[0], {
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        ...generationOptions(model, 1800, 0.35),
      } as any);

      const raw = parseModelText(result);
      if (!raw) throw new Error("Model returned an empty or unrecognized response.");

      const invalidCitations = invalidCitationIds(raw, allowedSourceIds);
      if (invalidCitations.length) {
        throw new Error(`Model cited sources outside the allowed set: ${invalidCitations.join(", ")}`);
      }

      console.log(JSON.stringify({
        requestId,
        event: "council_model_success",
        model,
        finishReason: finishReason(result),
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

async function handleTablePlan(request: Request) {
  const body = (await request.json().catch(() => null)) as CouncilRequest | null;
  const messages = sanitizeMessages(body?.messages);

  if (!messages.length || messages[messages.length - 1]?.role !== "user") {
    return json({ error: "A user question is required." }, { status: 400 });
  }

  const combinedUserText = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join("\n");

  return json(createTablePlan(combinedUserText));
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
  const requestedSourceIds = sanitizeSourceIds(body?.sourceIds);
  const preservedSources = body?.phase === "resume" ? resolveSources(requestedSourceIds) : [];
  const sources = preservedSources.length
    ? ensureArtistWitness(preservedSources, combinedUserText)
    : ensureArtistWitness(selectSources(combinedUserText), combinedUserText);
  const allowedSourceIds = new Set(sources.map((source) => source.id));
  const phaseInstruction = continuationInstruction(body?.phase, body?.pauseQuestion);
  const systemPrompt = `${COUNCIL_SYSTEM_PROMPT}${phaseInstruction}\n\nALLOWED SOURCES\n${formatSourceContext(sources)}`;
  const models = uniqueModels(env.COUNCIL_MODEL);

  try {
    const { raw, model, failures } = await runCouncilModel(
      env,
      models,
      messages,
      systemPrompt,
      allowedSourceIds,
      requestId,
    );
    const normalizedRaw = ensureArtistWitnessBadge(raw, sources);
    const parsed = extractPause(normalizedRaw);

    return json({
      ...parsed,
      phase: body?.phase === "resume" ? "resume" : "open",
      sources: sources.map(({ tags: _tags, anchors: _anchors, note: _note, ...source }) => source),
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
        workerVersion: env.CF_VERSION_METADATA
          ? {
              id: env.CF_VERSION_METADATA.id,
              tag: env.CF_VERSION_METADATA.tag,
              timestamp: env.CF_VERSION_METADATA.timestamp,
            }
          : null,
      });
    }

    if (url.pathname === "/api/table-plan" && request.method === "POST") {
      return handleTablePlan(request);
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
