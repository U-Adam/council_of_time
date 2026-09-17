import { COUNCIL_SYSTEM_PROMPT, formatSourceContext } from "./prompt";
import { ARTIST_WITNESS_IDS, ensureArtistWitness } from "./artistWitness";
import { ALL_SOURCE_CATALOG_V2, selectSourcesV2 } from "./selection";
import type { PublicSource } from "./sources";
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
const SOURCE_BY_ID = new Map(ALL_SOURCE_CATALOG_V2.map((source) => [source.id, source]));

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

export function recentSourceIds(messages: Message[], assistantLimit = 4) {
  const assistantMessages = messages.filter((message) => message.role === "assistant").slice(-assistantLimit);
  const ids: string[] = [];

  for (const message of assistantMessages) {
    const seenThisTurn = new Set<string>();
    for (const match of message.content.matchAll(/\[(S\d+)\]/g)) {
      const id = match[1];
      if (SOURCE_BY_ID.has(id) && !seenThisTurn.has(id)) {
        seenThisTurn.add(id);
        ids.push(id);
      }
    }
  }

  return ids;
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
  let cleaned = answer.trim();
  const choiceMatch = cleaned.match(/(?:^|\n)TABLE_CHOICE:\s*continue_or_close\s*$/);
  const tableChoice = Boolean(choiceMatch);

  if (choiceMatch) {
    cleaned = cleaned.replace(/(?:^|\n)TABLE_CHOICE:\s*continue_or_close\s*$/, "").trim();
  }

  const pauseMatch = cleaned.match(/(?:^|\n)PAUSE_QUESTION:\s*(.+?)\s*$/s);
  if (!pauseMatch) return { answer: cleaned, pause: null, tableChoice };

  cleaned = cleaned.replace(/(?:^|\n)PAUSE_QUESTION:\s*(.+?)\s*$/s, "").trim();
  return { answer: cleaned, pause: { question: pauseMatch[1].trim() }, tableChoice };
}

export function continuationInstruction(phase: unknown, pauseQuestion: unknown) {
  if (phase === "resume" && typeof pauseQuestion === "string" && pauseQuestion.trim()) {
    return `\n\nPOST-FAULT-LINE ANSWER STATE\nThe user is answering the table's prior fault-line question:\n${pauseQuestion.trim()}\n\nTreat the user's latest message as the answer to that question. Resume the existing deliberation instead of restarting it. Keep the existing table and source roster unless the answer itself makes a voice irrelevant. Do not repeat the initial Table. Explain concisely what the user's answer changes, strengthens, weakens, or leaves unresolved in the competing frameworks. Do NOT yet give Bourdain's Read, Where This Meets You, a Council Finding, Minority Report, What Would Change This?, a final recommendation, or closing synthesis. End with exactly TABLE_CHOICE: continue_or_close and nothing after it. Do not ask another PAUSE_QUESTION in this stage.`;
  }

  if (phase === "conclude") {
    return `\n\nCONCLUDING ROUND STATE\nThe user has already answered the prior fault-line question and has now chosen to continue the table. Treat the latest user message as a procedural signal, not new substantive evidence. Resume the existing deliberation from the post-answer checkpoint instead of restarting it. Keep the existing table and source roster. Do not repeat the initial Table or the fault-line question. Deepen the remaining disagreement only where useful, then proceed to Bourdain's Read, Where This Meets You when relevant, a Council Finding, and optional Minority Report or What Would Change This? Do not emit TABLE_CHOICE or PAUSE_QUESTION again in this concluding round.`;
  }

  if (phase === "resume") {
    return `\n\nPOST-FAULT-LINE ANSWER STATE\nThe user is continuing from a fault-line checkpoint, but the prior question was not supplied. Treat the latest substantive user message as the answer that advances the existing case. Do not restart the Table. Explain what the answer changes and end with exactly TABLE_CHOICE: continue_or_close and nothing after it. Do not synthesize yet.`;
  }

  return "";
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

  const latestUserText = messages[messages.length - 1].content;
  const recentIds = recentSourceIds(messages);

  return json(createTablePlan(latestUserText, undefined, recentIds));
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

  const latestUserText = messages[messages.length - 1].content;
  const recentIds = recentSourceIds(messages);
  const requestedSourceIds = sanitizeSourceIds(body?.sourceIds);
  const continuing = body?.phase === "resume" || body?.phase === "conclude";
  const preservedSources = continuing ? resolveSources(requestedSourceIds) : [];
  const tablePlan = continuing ? null : createTablePlan(latestUserText, undefined, recentIds);
  const plannedSources = tablePlan ? resolveSources(tablePlan.sourceIds) : [];
  const sources = preservedSources.length
    ? ensureArtistWitness(preservedSources, latestUserText, 9, recentIds)
    : ensureArtistWitness(
        plannedSources.length ? plannedSources : selectSourcesV2(latestUserText, 9, recentIds),
        latestUserText,
        9,
        recentIds,
      );
  const allowedSourceIds = new Set(sources.map((source) => source.id));
  const phaseInstruction = continuationInstruction(body?.phase, body?.pauseQuestion);
  const plannedArtist = tablePlan?.artistWitness
    ? ` The selected Artist Witness is ${tablePlan.artistWitness}.`
    : " No Artist Witness is required for this table. Do not add one unless an artist source is actually present in the supplied source set and materially improves the argument.";
  const tableInstruction = tablePlan
    ? `\n\nTABLE PLAN\nThis is an initial ${tablePlan.depth} Council. The Table is not optional and must seat every planned thinker as a separate row: ${tablePlan.voices.join(", ")}.${plannedArtist} That means at least ${tablePlan.minimumParticipants} participant rows. Anthony Bourdain moderates and does not count as one of those participant rows. Do not collapse the Table to three voices merely because three frameworks seem dominant. The point of the table is productive disagreement across distinct supported lenses. If one planned voice cannot be responsibly represented from the supplied sources, replace that seat with another supported supplied voice rather than shrinking below five participant rows. Keep each row compact so the larger table does not crowd out the Deliberation.`
    : "";
  const selectionInstruction = `\n\nSELECTION DISCIPLINE\nThe supplied source roster was chosen for this question by relevance first, with recent repetition used only as a tiebreaker among comparably relevant voices. Use the strongest distinct perspectives actually supported by these sources. Do not default to a familiar recurring voice when another supplied voice is comparably relevant and adds a genuinely different tradition, discipline, or moral lens. Never sacrifice a materially stronger source merely for novelty or demographic rotation.`;
  const systemPrompt = `${COUNCIL_SYSTEM_PROMPT}${phaseInstruction}${tableInstruction}${selectionInstruction}\n\nALLOWED SOURCES\n${formatSourceContext(sources)}`;
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
      phase: body?.phase === "resume" ? "resume" : body?.phase === "conclude" ? "conclude" : "open",
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