import { FormEvent, useMemo, useRef, useState } from "react";
import { ArrowUp, ExternalLink, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import type { ChatMessage, CouncilResponse, CouncilSource } from "./types";

const STARTERS = [
  "Can love survive contempt?",
  "What do I owe someone after I change my mind?",
  "When does forgiveness become permission?",
];

function SourceLinks({ sources }: { sources: CouncilSource[] }) {
  if (!sources.length) return null;
  return (
    <section className="sources" aria-label="Sources">
      <div className="section-kicker">Sources</div>
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
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const tokens = text.split(/(\[S\d+\])/g);
  return tokens.map((token, index) => {
    const id = token.match(/^\[(S\d+)\]$/)?.[1];
    const source = id ? sourceMap.get(id) : undefined;
    if (!source) return <span key={index}>{token}</span>;
    return (
      <a
        key={`${id}-${index}`}
        href={source.url}
        target="_blank"
        rel="noreferrer"
        className="inline-cite"
        aria-label={`Open source ${id}: ${source.title}`}
      >
        [{id.replace("S", "")}]
      </a>
    );
  });
}

function mergeSources(current: CouncilSource[], incoming: CouncilSource[]) {
  return [...new Map([...current, ...incoming].map((source) => [source.id, source])).values()];
}

export function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sources, setSources] = useState<CouncilSource[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [pauseQuestion, setPauseQuestion] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const transcript = useMemo(() => messages.slice(-10), [messages]);

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

    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    setInput("");
    setPending(true);
    setPauseQuestion(null);

    try {
      const response = await fetch("/api/council", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          phase: answeringPause ? "resume" : "open",
          pauseQuestion: priorPause,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || `Council unavailable (${response.status})`);
      }

      const data = (await response.json()) as CouncilResponse;
      setMessages((current) => [...current, { role: "assistant", content: data.answer }]);
      setSources((current) => mergeSources(current, data.sources || []));
      setPauseQuestion(data.pause?.question || null);
    } catch (error) {
      setPauseQuestion(priorPause);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? `The table couldn't convene: ${error.message}`
              : "The table couldn't convene. Try again in a moment.",
        },
      ]);
    } finally {
      setPending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submitQuestion(input);
  }

  function reset() {
    setMessages([]);
    setSources([]);
    setPauseQuestion(null);
    setInput("");
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
                <div className="thinking"><i /><i /><i /> Convening the table</div>
              </article>
            )}
          </div>
        )}

        {pauseQuestion && !pending && (
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

        {hasConversation && <SourceLinks sources={sources} />}

        <div className="privacy-note">
          <ShieldCheck size={14} /> This build stores no conversation history on the Council server.
        </div>
      </section>
    </main>
  );
}
