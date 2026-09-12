import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowUp, ExternalLink, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import type { ChatMessage, CouncilResponse, CouncilSource } from "./types";

const STARTERS = [
  "Can love survive contempt?",
  "What do I owe someone after I change my mind?",
  "When does forgiveness become permission?",
];

const REQUEST_TIMEOUT_MS = 75_000;

type CouncilPayload = {
  messages: ChatMessage[];
  phase: "open" | "resume";
  pauseQuestion: string | null;
};

type FailedAttempt = {
  payload: CouncilPayload;
  priorPause: string | null;
  message: string;
  requestId?: string;
};

type VoiceRule = {
  name: string;
  terms: string[];
};

const VOICE_RULES: VoiceRule[] = [
  { name: "bell hooks", terms: ["love", "relationship", "marriage", "contempt", "care", "intimacy", "domination", "patriarchy"] },
  { name: "Søren Kierkegaard", terms: ["love", "choice", "faith", "anxiety", "despair", "commitment", "self", "relationship"] },
  { name: "Simone de Beauvoir", terms: ["relationship", "love", "freedom", "ambiguity", "gender", "oppression", "reciprocity", "embodiment"] },
  { name: "James Baldwin", terms: ["love", "hatred", "identity", "innocence", "race", "america", "self-deception", "responsibility"] },
  { name: "Martha Nussbaum", terms: ["forgive", "forgiveness", "anger", "emotion", "dignity", "justice", "flourishing", "vulnerability"] },
  { name: "Albert Camus", terms: ["meaning", "death", "mortality", "absurd", "rebellion", "solidarity", "limits", "grief"] },
  { name: "Nāgārjuna", terms: ["suffering", "attachment", "identity", "self", "emptiness", "interdependence", "impermanence"] },
  { name: "Hannah Arendt", terms: ["responsibility", "judgment", "politics", "public", "evil", "thoughtlessness", "plurality", "action"] },
  { name: "Michel Foucault", terms: ["power", "discipline", "surveillance", "normalization", "institution", "knowledge", "sexuality"] },
  { name: "Frantz Fanon", terms: ["colonial", "colonialism", "racism", "violence", "liberation", "dehumanization", "domination"] },
  { name: "John Stuart Mill", terms: ["liberty", "freedom", "harm", "coercion", "utility", "individuality", "rights"] },
  { name: "Immanuel Kant", terms: ["duty", "promise", "lying", "obligation", "respect", "dignity", "autonomy", "person"] },
  { name: "Confucius", terms: ["family", "duty", "ritual", "respect", "character", "conduct", "relationship"] },
  { name: "Plato", terms: ["justice", "virtue", "truth", "soul", "knowledge", "politics"] },
];

function SourceLinks({ sources }: { sources: CouncilSource[] }) {
  if (!sources.length) return null;
  return (
    <section className="sources" aria-label="Sources cited by the Council">
      <div className="section-kicker">Sources cited</div>
      <div className="source-grid">
        {sources.map((source) => (
          <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="source-card">
            <span className="source-id">{source.id}</span>
            <span>{source.title}</span>
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        ))}
      </div>
    </section>
  );
}

function renderAnswer(text: string, sources: CouncilSource[]) {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const sourceByUrl = new Map(sources.map((source) => [source.url, source]));
  const markdown = text.replace(/\[S(\d+)\]/g, (token, number) => {
    const source = sourceById.get(`S${number}`);
    return source ? `[\\[${number}\\]](${source.url})` : token;
  });

  return (
    <ReactMarkdown
      components={{
        a: ({ href, children }) => {
          const source = href ? sourceByUrl.get(href) : undefined;
          return (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className={source ? "inline-cite" : "answer-link"}
              aria-label={source ? `Open source ${source.id}: ${source.title}` : undefined}
            >
              {children}
            </a>
          );
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}

function mergeSources(current: CouncilSource[], incoming: CouncilSource[]) {
  return [...new Map([...current, ...incoming].map((source) => [source.id, source])).values()];
}

function citedSourceIds(messages: ChatMessage[]) {
  const orderedIds: string[] = [];
  const seen = new Set<string>();

  for (const message of messages) {
    if (message.role !== "assistant") continue;
    for (const match of message.content.matchAll(/\[S(\d+)\]/g)) {
      const id = `S${match[1]}`;
      if (!seen.has(id)) {
        seen.add(id);
        orderedIds.push(id);
      }
    }
  }

  return orderedIds;
}

function selectInvitees(question: string, max = 3) {
  const normalized = question.toLowerCase();
  return VOICE_RULES
    .map((rule, index) => ({
      ...rule,
      index,
      score: rule.terms.reduce((total, term) => total + (normalized.includes(term) ? 1 : 0), 0),
    }))
    .filter((rule) => rule.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, max)
    .map((rule) => rule.name);
}

function formatNames(names: string[]) {
  if (names.length === 0) return "a few dissenting voices";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sources, setSources] = useState<CouncilSource[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [pauseQuestion, setPauseQuestion] = useState<string | null>(null);
  const [failedAttempt, setFailedAttempt] = useState<FailedAttempt | null>(null);
  const [conveningLine, setConveningLine] = useState("Convening the table…");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const progressTimers = useRef<number[]>([]);

  const transcript = useMemo(() => messages.slice(-10), [messages]);
  const citedSources = useMemo(() => {
    const sourceById = new Map(sources.map((source) => [source.id, source]));
    return citedSourceIds(messages)
      .map((id) => sourceById.get(id))
      .filter((source): source is CouncilSource => Boolean(source));
  }, [messages, sources]);

  function clearProgressTimers() {
    progressTimers.current.forEach((timer) => window.clearTimeout(timer));
    progressTimers.current = [];
  }

  function beginConvening(question: string, resuming: boolean) {
    clearProgressTimers();
    const invitees = selectInvitees(question);
    const names = formatNames(invitees);
    const stages = resuming
      ? [
          "Reopening the table…",
          invitees.length ? `Bringing ${names} back into the argument…` : "Bringing the disagreement back to the table…",
          "Testing your answer against the disagreement…",
          "Bourdain is checking whether the fault line moved…",
          "Working toward a finding…",
        ]
      : [
          "Reading the question…",
          invitees.length ? `Inviting ${names} to the table…` : "Inviting a few dissenting voices to the table…",
          "Checking the source material…",
          "The table is arguing…",
          "Bourdain is looking for the fault line…",
        ];
    const delays = [0, 650, 2100, 4300, 7200];

    setConveningLine(stages[0]);
    for (let index = 1; index < stages.length; index += 1) {
      progressTimers.current.push(
        window.setTimeout(() => setConveningLine(stages[index]), delays[index]),
      );
    }
    progressTimers.current.push(
      window.setTimeout(
        () => setConveningLine(resuming ? "The table is still working toward the finding…" : "Still at the table. This one needs a minute…"),
        11_500,
      ),
    );
  }

  useEffect(() => () => clearProgressTimers(), []);

  async function requestCouncil(payload: CouncilPayload, priorPause: string | null) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch("/api/council", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(body?.error || `Council unavailable (${response.status})`) as Error & {
          requestId?: string;
        };
        error.requestId = body?.requestId;
        throw error;
      }

      const data = body as CouncilResponse;
      setMessages((current) => [...current, { role: "assistant", content: data.answer }]);
      setSources((current) => mergeSources(current, data.sources || []));
      setPauseQuestion(data.pause?.question || null);
      setFailedAttempt(null);
    } catch (error) {
      const typed = error as Error & { requestId?: string };
      const timedOut = typed?.name === "AbortError";
      setPauseQuestion(priorPause);
      setFailedAttempt({
        payload,
        priorPause,
        message: timedOut
          ? "The Council took too long to answer. Nothing was lost; try the same question again."
          : typed?.message || "The Council could not convene. Try again in a moment.",
        requestId: typed?.requestId,
      });
    } finally {
      window.clearTimeout(timeout);
      clearProgressTimers();
      setPending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  async function submitQuestion(question: string) {
    const trimmed = question.trim();
    if (!trimmed || pending) return;

    const priorPause = pauseQuestion;
    const answeringPause = Boolean(priorPause);
    const contextMessages: ChatMessage[] = priorPause
      ? [
          ...transcript,
          {
            role: "assistant",
            content: `The table paused before synthesis with this question for the user: ${priorPause}`,
          },
        ]
      : transcript;
    const nextMessages: ChatMessage[] = [...contextMessages, { role: "user", content: trimmed }];
    const payload: CouncilPayload = {
      messages: nextMessages,
      phase: answeringPause ? "resume" : "open",
      pauseQuestion: priorPause,
    };

    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    setInput("");
    setPending(true);
    setPauseQuestion(null);
    setFailedAttempt(null);
    beginConvening(trimmed, answeringPause);

    await requestCouncil(payload, priorPause);
  }

  async function retryFailed() {
    if (!failedAttempt || pending) return;
    const attempt = failedAttempt;
    const lastUserMessage = [...attempt.payload.messages].reverse().find((message) => message.role === "user");
    setPending(true);
    setPauseQuestion(null);
    setFailedAttempt(null);
    beginConvening(lastUserMessage?.content || "", attempt.payload.phase === "resume");
    await requestCouncil(attempt.payload, attempt.priorPause);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submitQuestion(input);
  }

  function reset() {
    clearProgressTimers();
    setMessages([]);
    setSources([]);
    setPauseQuestion(null);
    setFailedAttempt(null);
    setInput("");
    setConveningLine("Convening the table…");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const hasConversation = messages.length > 0;

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="The Council of Time home">
          <span className="mark" aria-hidden="true">C</span>
          <span>
            <strong>The Council of Time</strong>
            <small>Questions worth arguing about</small>
          </span>
        </a>
        {hasConversation && (
          <button className="ghost-button" onClick={reset} type="button">
            <RotateCcw size={15} /> New table
          </button>
        )}
      </header>

      <section className={hasConversation ? "conversation" : "hero"}>
        {!hasConversation && (
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={14} /> A serious table for difficult questions</div>
            <h1>What brings you to the table?</h1>
            <p>
              Bring a moral problem, a relationship, a political argument, a piece of art, a decision, or something you cannot quite name yet.
            </p>
          </div>
        )}

        {hasConversation && (
          <div className="thread" aria-live="polite">
            {messages.map((message, index) => (
              <article key={index} className={`message ${message.role}`}>
                <div className="message-label">{message.role === "user" ? "You" : "The Council"}</div>
                <div className="message-body">
                  {message.role === "assistant" ? renderAnswer(message.content, sources) : message.content}
                </div>
              </article>
            ))}
            {pending && (
              <article className="message assistant loading">
                <div className="message-label">The Council</div>
                <div className="thinking">
                  <span className="thinking-dots" aria-hidden="true"><i /><i /><i /></span>
                  <span key={conveningLine} className="thinking-copy">{conveningLine}</span>
                </div>
              </article>
            )}
          </div>
        )}

        {failedAttempt && !pending && (
          <section className="error-card" role="alert">
            <div className="section-kicker">The table couldn't convene</div>
            <p>{failedAttempt.message}</p>
            <div className="error-actions">
              <button type="button" onClick={() => void retryFailed()}>Try again</button>
              {failedAttempt.requestId && <span>Reference {failedAttempt.requestId}</span>}
            </div>
          </section>
        )}

        {pauseQuestion && !pending && !failedAttempt && (
          <section className="pause-card">
            <div className="section-kicker">Bourdain pauses the table</div>
            <h2>{pauseQuestion}</h2>
            <p>Your answer could materially change the Council's reasoning. The table will wait.</p>
          </section>
        )}

        <form className="composer" onSubmit={onSubmit}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submitQuestion(input);
              }
            }}
            placeholder={pauseQuestion ? "Answer the fault-line question…" : "What brings you to the table?"}
            rows={1}
            aria-label="Your question"
          />
          <button type="submit" className="send-button" disabled={!input.trim() || pending} aria-label="Send">
            <ArrowUp size={20} />
          </button>
        </form>

        {!hasConversation && (
          <div className="starters" aria-label="Example questions">
            {STARTERS.map((starter) => (
              <button key={starter} type="button" onClick={() => void submitQuestion(starter)}>
                {starter}
              </button>
            ))}
          </div>
        )}

        {hasConversation && <SourceLinks sources={citedSources} />}

        <div className="privacy-note">
          <ShieldCheck size={14} /> This build stores no conversation history on the Council server.
        </div>
      </section>
    </main>
  );
}
