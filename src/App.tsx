import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowRight, ArrowUp, ExternalLink, RotateCcw, ShieldCheck, Sparkles, X } from "lucide-react";
import type { ChatMessage, CouncilResponse, CouncilSource } from "./types";

const STARTERS = [
  "Will there ever be another Winston Churchill?",
  "Can love survive contempt?",
  "When does loyalty become cowardice?",
];

const REQUEST_TIMEOUT_MS = 75_000;

const ATTRIBUTION_DEFINITIONS = {
  Derived: "A present-day application that strongly follows from the source framework, even though the source did not address this exact case.",
  Speculative: "A plausible but weaker, contested, historically remote, or interpretively ambitious extrapolation.",
} as const;

type AttributionKind = keyof typeof ATTRIBUTION_DEFINITIONS;

type CouncilPayload = {
  messages: ChatMessage[];
  phase: "open" | "resume" | "conclude";
  pauseQuestion: string | null;
  sourceIds?: string[];
};

type FailedAttempt = {
  payload: CouncilPayload;
  priorPause: string | null;
  message: string;
  requestId?: string;
};

type TablePlan = {
  voices?: string[];
  artistWitness?: string | null;
  moderator?: string;
};

function AttributionBadge({ kind }: { kind: AttributionKind }) {
  const [open, setOpen] = useState(false);
  const definition = ATTRIBUTION_DEFINITIONS[kind];

  return (
    <span className={`attribution-wrap ${open ? "open" : ""}`}>
      <button
        type="button"
        className={`attribution-badge ${kind.toLowerCase()}`}
        aria-label={`${kind} attribution: ${definition}`}
        aria-expanded={open}
        title={definition}
        onClick={() => setOpen((current) => !current)}
        onBlur={() => setOpen(false)}
      >
        {kind}
      </button>
      <span className="attribution-tooltip" role="tooltip" aria-hidden={!open}>
        {definition}
      </span>
    </span>
  );
}

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
  const markdown = text
    .replace(/\{\{(Derived|Speculative)\}\}/g, (_token, kind) => `\`${kind}\``)
    .replace(/\[S(\d+)\]/g, (token, number) => {
      const source = sourceById.get(`S${number}`);
      return source ? `[${number}](${source.url})` : token;
    });

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({ children }) => (
          <div className="council-table-wrap">
            <table>{children}</table>
          </div>
        ),
        code: ({ children, className }) => {
          const label = String(children).trim();
          if (label === "Derived" || label === "Speculative") {
            return <AttributionBadge kind={label} />;
          }
          if (label === "Artist Witness") {
            return <span className="artist-witness-badge">Artist Witness</span>;
          }
          return <code className={className}>{children}</code>;
        },
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

function formatNames(names: string[]) {
  if (names.length === 0) return "the selected voices";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sources, setSources] = useState<CouncilSource[]>([]);
  const [activeSourceIds, setActiveSourceIds] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [pauseQuestion, setPauseQuestion] = useState<string | null>(null);
  const [tableChoice, setTableChoice] = useState(false);
  const [pauseDecision, setPauseDecision] = useState<"choice" | "closed">("choice");
  const [failedAttempt, setFailedAttempt] = useState<FailedAttempt | null>(null);
  const [conveningLine, setConveningLine] = useState("Convening the table…");
  const [aboutOpen, setAboutOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const aboutDialogRef = useRef<HTMLDialogElement>(null);
  const progressTimers = useRef<number[]>([]);
  const conveningSequence = useRef(0);

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

  function stopConvening() {
    clearProgressTimers();
    conveningSequence.current += 1;
  }

  function beginConvening(payload: CouncilPayload) {
    clearProgressTimers();
    const sequence = ++conveningSequence.current;
    const schedule = (line: string, delay: number) => {
      progressTimers.current.push(
        window.setTimeout(() => {
          if (conveningSequence.current === sequence) setConveningLine(line);
        }, delay),
      );
    };

    if (payload.phase === "resume") {
      setConveningLine("Reopening the fault line…");
      schedule("Bringing your answer back to the table…", 700);
      schedule("Testing what your answer changes…", 2600);
      schedule("Bourdain is checking where the disagreement now stands…", 5200);
      schedule("The table is weighing the next move…", 8200);
      return;
    }

    if (payload.phase === "conclude") {
      setConveningLine("Continuing the table…");
      schedule("Returning to the strongest disagreement…", 700);
      schedule("Testing what survived the fault line…", 2600);
      schedule("Bourdain is pulling the argument back to lived consequence…", 5200);
      schedule("Working toward a finding…", 8200);
      schedule("The table is still working toward the finding…", 12_000);
      return;
    }

    setConveningLine("Reading the question…");
    let planResolved = false;
    schedule("Checking the source material…", 2800);
    schedule("The table is arguing…", 5200);
    schedule("Bourdain is looking for the fault line…", 8200);
    schedule("Still at the table. This one needs a minute…", 12_000);

    void fetch("/api/table-plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: payload.messages }),
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as TablePlan;
      })
      .then((plan) => {
        planResolved = true;
        if (!plan || conveningSequence.current !== sequence) return;
        const voices = (plan.voices || []).slice(0, 3);
        const voiceNames = formatNames(voices);
        const line = plan.artistWitness
          ? `Inviting ${voiceNames} — with ${plan.artistWitness} as Artist Witness…`
          : `Inviting ${voiceNames} to the table…`;
        setConveningLine(line);
      })
      .catch(() => {
        planResolved = true;
      });

    progressTimers.current.push(
      window.setTimeout(() => {
        if (!planResolved && conveningSequence.current === sequence) {
          setConveningLine("Selecting the voices that disagree most usefully…");
        }
      }, 700),
    );
  }

  useEffect(() => () => stopConvening(), []);

  useEffect(() => {
    const dialog = aboutDialogRef.current;
    if (!dialog) return;

    if (aboutOpen && !dialog.open) dialog.showModal();
    if (!aboutOpen && dialog.open) dialog.close();
  }, [aboutOpen]);

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
      const nextPause = data.pause?.question || null;
      setMessages((current) => [...current, { role: "assistant", content: data.answer }]);
      setSources((current) => mergeSources(current, data.sources || []));
      setActiveSourceIds((data.sources || []).map((source) => source.id));
      setPauseQuestion(nextPause);
      setTableChoice(Boolean(data.tableChoice));
      setPauseDecision("choice");
      setFailedAttempt(null);
    } catch (error) {
      const typed = error as Error & { requestId?: string };
      const timedOut = typed?.name === "AbortError";
      setPauseQuestion(priorPause);
      setTableChoice(false);
      setPauseDecision("choice");
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
      stopConvening();
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
            content: `The table paused at the fault line with this question for the user: ${priorPause}`,
          },
        ]
      : transcript;
    const nextMessages: ChatMessage[] = [...contextMessages, { role: "user", content: trimmed }];
    const payload: CouncilPayload = {
      messages: nextMessages,
      phase: answeringPause ? "resume" : "open",
      pauseQuestion: priorPause,
      sourceIds: answeringPause && activeSourceIds.length ? activeSourceIds : undefined,
    };

    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    setInput("");
    setPending(true);
    setPauseQuestion(null);
    setTableChoice(false);
    setPauseDecision("choice");
    setFailedAttempt(null);
    setAboutOpen(false);
    beginConvening(payload);

    await requestCouncil(payload, priorPause);
  }

  async function continueAfterAnswer() {
    if (pending || !tableChoice || pauseQuestion) return;

    const nextMessages: ChatMessage[] = [...transcript, { role: "user", content: "Continue the table." }];
    const payload: CouncilPayload = {
      messages: nextMessages,
      phase: "conclude",
      pauseQuestion: null,
      sourceIds: activeSourceIds.length ? activeSourceIds : undefined,
    };

    setPending(true);
    setTableChoice(false);
    setPauseDecision("choice");
    setFailedAttempt(null);
    beginConvening(payload);

    await requestCouncil(payload, null);
  }

  async function retryFailed() {
    if (!failedAttempt || pending) return;
    const attempt = failedAttempt;
    setPending(true);
    setPauseQuestion(null);
    setTableChoice(false);
    setPauseDecision("choice");
    setFailedAttempt(null);
    beginConvening(attempt.payload);
    await requestCouncil(attempt.payload, attempt.priorPause);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submitQuestion(input);
  }

  function continueAfterFaultLineAnswer() {
    void continueAfterAnswer();
  }

  function callItANight() {
    setInput("");
    setPauseDecision("closed");
  }

  function reset() {
    stopConvening();
    setMessages([]);
    setSources([]);
    setActiveSourceIds([]);
    setPauseQuestion(null);
    setTableChoice(false);
    setPauseDecision("choice");
    setFailedAttempt(null);
    setInput("");
    setAboutOpen(false);
    setConveningLine("Convening the table…");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const hasConversation = messages.length > 0;
  const awaitingFaultLineAnswer = Boolean(pauseQuestion) && !pending && !failedAttempt && !tableChoice;
  const atRoundBreak = tableChoice && !pending && !failedAttempt;

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

      <section className={hasConversation ? "conversation" : "hero"} aria-busy={pending}>
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
          <div className="thread" role="log" aria-live="polite" aria-relevant="additions text">
            {messages.map((message, index) => (
              <article key={index} className={`message ${message.role}`}>
                <div className="message-label">{message.role === "user" ? "You" : "The Council"}</div>
                <div className="message-body">
                  {message.role === "assistant" ? renderAnswer(message.content, sources) : message.content}
                </div>
              </article>
            ))}
            {pending && (
              <article className="message assistant loading" role="status" aria-live="polite">
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

        {awaitingFaultLineAnswer && (
          <section className="pause-card" role="region" aria-labelledby="fault-line-question">
            <div className="section-kicker">Bourdain pauses the table</div>
            <h2 id="fault-line-question">{pauseQuestion}</h2>
            <p>Your answer is part of the deliberation. Once you answer it, you can decide whether to continue the table or call it a night.</p>
          </section>
        )}

        {atRoundBreak && (
          <section className="pause-card" role="region" aria-labelledby="round-break-title">
            <div className="section-kicker">
              {pauseDecision === "closed" ? "The table calls it a night" : "After the fault line"}
            </div>
            <h2 id="round-break-title">
              {pauseDecision === "closed" ? "We can leave it here." : "Keep going?"}
            </h2>
            {pauseDecision === "closed" ? (
              <p>Your answer is on the record, and the disagreement can remain unresolved without forcing a Council Finding.</p>
            ) : (
              <>
                <p>The Council has your answer. Continue for the concluding round, or call it a night here.</p>
                <div className="error-actions" style={{ marginTop: 14 }}>
                  <button type="button" onClick={continueAfterFaultLineAnswer}>Continue the table</button>
                  <button type="button" className="ghost-button" onClick={callItANight}>Call it a night</button>
                </div>
              </>
            )}
          </section>
        )}

        {!tableChoice && pauseDecision !== "closed" && (
          <form className="composer" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="council-question">
              {pauseQuestion ? "Answer the fault-line question" : "Ask the Council"}
            </label>
            <textarea
              id="council-question"
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
            />
            <button type="submit" className="send-button" disabled={!input.trim() || pending} aria-label="Send">
              <ArrowUp size={20} />
            </button>
          </form>
        )}

        {!hasConversation && (
          <>
            <div className="starters" role="group" aria-label="Suggested questions">
              {STARTERS.map((starter) => (
                <button key={starter} type="button" onClick={() => void submitQuestion(starter)}>
                  {starter}
                </button>
              ))}
            </div>

            <div className="home-secondary-action">
              <button className="about-button" type="button" onClick={() => setAboutOpen(true)}>
                About the Council <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
          </>
        )}

        {hasConversation && <SourceLinks sources={citedSources} />}

        <div className="privacy-note">
          <ShieldCheck size={14} /> The app does not keep a server-side conversation history between sessions.
        </div>
      </section>

      <dialog
        ref={aboutDialogRef}
        className="about-dialog"
        aria-labelledby="about-council-title"
        onClose={() => setAboutOpen(false)}
        onCancel={() => setAboutOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setAboutOpen(false);
        }}
      >
        <div className="about-dialog-card">
          <button className="about-close" type="button" aria-label="Close About the Council" onClick={() => setAboutOpen(false)}>
            <X size={18} aria-hidden="true" />
          </button>
          <div className="section-kicker">About the Council</div>
          <h2 id="about-council-title">A table built to disagree.</h2>
          <p>
            The Council of Time is a deliberative framework for difficult questions. Anthony Bourdain moderates as a documented witness—not an impersonation—and selects voices for useful disagreement rather than easy consensus.
          </p>
          <p>
            Each substantive table draws from relevant Council members and includes at least one Artist Witness. Claims about thinkers are grounded in sources; present-day applications are marked Derived or Speculative when the evidence requires that distance.
          </p>
          <p>
            The first round reaches a genuine fault line and asks one focused question. After you answer it, you decide whether to continue into the concluding round or call it a night without forcing a finding. Continuing carries the answer through the disagreement toward Bourdain's Read and a Council Finding.
          </p>
          <button className="about-return" type="button" onClick={() => setAboutOpen(false)}>
            Return to the table
          </button>
        </div>
      </dialog>
    </main>
  );
}