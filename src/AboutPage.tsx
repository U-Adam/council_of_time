import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Braces,
  Gavel,
  Library,
  Scale,
  ShieldCheck,
  Users,
  Waves,
} from "lucide-react";

type Panel = {
  id: string;
  index: string;
  title: string;
  abstract: string;
  action: string;
  icon: ReactNode;
  sourceBasis: string;
  body: ReactNode;
};

const PANELS: Panel[] = [
  {
    id: "council",
    index: "01",
    title: "The Council",
    abstract:
      "A deliberately plural table of thinkers across traditions and centuries, selected for the questions they can illuminate and the pressure they can place on one another.",
    action: "Explore the Council",
    icon: <Users size={19} aria-hidden="true" />,
    sourceBasis: "Council Roster · Round Table Constitution",
    body: (
      <>
        <p>
          The Council is a permanent intellectual roster spanning ancient philosophy, religious traditions, Enlightenment thought, existentialism, political theory, feminism, critical theory, postcolonial thought, and contemporary moral philosophy.
        </p>
        <p>
          Its breadth is methodological rather than decorative. Different traditions begin with different accounts of the human person, freedom, responsibility, justice, suffering, political authority, obligation, virtue, and the good life. The Council therefore does not assume that disagreement can always be reconciled.
        </p>
        <p>
          A Kantian argument about duty can conflict fundamentally with a consequentialist argument derived from Mill. Nāgārjuna's treatment of fixed identity does not simply translate into a Western theory of the self. Confucian relational obligation cannot be reduced to modern individualism. Fanon's analysis of colonial domination raises questions that cannot be reproduced simply by substituting the vocabulary of another tradition.
        </p>
        <p>
          Those differences are preserved rather than flattened. For each inquiry, the entire roster does not speak. A smaller table is selected according to intellectual relevance and the likelihood of productive disagreement. The objective is to assemble the strongest conversation for the question, not the largest collection of famous names.
        </p>
      </>
    ),
  },
  {
    id: "moderator",
    index: "02",
    title: "Anthony Bourdain, Moderator",
    abstract:
      "Bourdain keeps philosophy in contact with human consequence: labor, dignity, class, power, hospitality, hypocrisy, and the people abstractions tend to leave out.",
    action: "Why Bourdain?",
    icon: <Gavel size={19} aria-hidden="true" />,
    sourceBasis: "Artists & Witnesses · Council Roster · Round Table Constitution",
    body: (
      <>
        <p>
          Anthony Bourdain occupies a different role from the philosophers at the table. He moderates. The Council does not treat him as a systematic philosopher, a final moral authority, or a character whose dialogue may simply be invented.
        </p>
        <p>
          His role is grounded in recurring concerns documented across his writing, television work, essays, and interviews: labor, class, hospitality, dignity, exploitation, cultural humility, friendship, appetite, loneliness, hypocrisy, mortality, and the distance between respectable abstractions and lived experience.
        </p>
        <h3>The Human Test</h3>
        <p>
          When an argument becomes elegant enough to forget the people living inside it, the moderator brings those people back into view. Who performs the labor? Who absorbs the cost? Who possesses power? Who benefits from the arrangement? Who is being described but never heard? Who has disappeared because the vocabulary of the argument made them invisible?
        </p>
        <p>
          Bourdain therefore has no automatic final word. His function is methodological: to test whether an intellectually satisfying position can survive contact with the kitchen, the street, the workplace, the family, the border, the hospital, the bar, and the ordinary human beings who bear its consequences.
        </p>
      </>
    ),
  },
  {
    id: "witnesses",
    index: "03",
    title: "Artists & Witnesses",
    abstract:
      "Art enters the table as evidence of lived experience, ambiguity, culture, suffering, beauty, and social life—not as philosophy wearing a different costume.",
    action: "Meet the witnesses",
    icon: <Waves size={19} aria-hidden="true" />,
    sourceBasis: "Artists & Witnesses · Primary Source Guide · Round Table Constitution",
    body: (
      <>
        <p>
          The Council distinguishes systematic philosophical argument from artistic witness. A treatise can define concepts, construct arguments, and answer objections explicitly. A novel, painting, song, performance, or film often works differently: it can reveal ambiguity, contradiction, suffering, domination, longing, absurdity, beauty, alienation, or moral experience without reducing those things to doctrine.
        </p>
        <p>
          Artists including Bob Dylan, David Byrne, Octavia E. Butler, Leonard Cohen, Frida Kahlo, Jean-Michel Basquiat, John Lennon, and Yoko Ono participate in that second capacity. Their work can illuminate dimensions of human life that formal argument may leave underdescribed.
        </p>
        <h3>Genre is part of the evidence</h3>
        <p>
          A narrator in a song is not automatically the songwriter. A fictional character is not automatically the novelist. A symbol in a painting cannot automatically be treated as autobiographical testimony. One lyric, image, interview, or work cannot responsibly establish an artist's complete worldview.
        </p>
        <p>
          Where artistic evidence matters, the Council prefers the artist's actual work, published writings, interviews, letters, talks, and authorized archives. Biography and criticism remain secondary interpretation. The witnesses are not present to decorate philosophical arguments with quotations; they are present because human beings encounter questions of love, grief, power, identity, mortality, beauty, violence, belonging, and meaning through culture as well as philosophy.
        </p>
      </>
    ),
  },
  {
    id: "method",
    index: "04",
    title: "How the Table Works",
    abstract:
      "A repeatable deliberative sequence: frame the real question, convene useful disagreement, ground the claims, pressure-test the argument, and expose what remains unresolved.",
    action: "See the method",
    icon: <Braces size={19} aria-hidden="true" />,
    sourceBasis: "Round Table Constitution · Deliberation Protocol A–H",
    body: (
      <>
        <p>
          Council deliberations follow a repeatable structure. The method is intended to make the reasoning inspectable rather than merely persuasive.
        </p>
        <div className="about-method-steps">
          <div><strong>Frame.</strong><span>Separate the immediate question from the deeper philosophical problem beneath it.</span></div>
          <div><strong>Convene.</strong><span>Select a limited table for intellectual relevance and productive disagreement rather than support for a preferred answer.</span></div>
          <div><strong>Ground.</strong><span>Check relevant doctrines against primary sources and reputable scholarship. For contemporary events, establish the factual record before moral interpretation.</span></div>
          <div><strong>Deliberate.</strong><span>Present the strongest versions of competing positions and use challenge, reply, pressure testing, and breaking points when useful.</span></div>
          <div><strong>Human Test.</strong><span>Return the abstraction to actual people, labor, institutions, power, suffering, and consequence.</span></div>
          <div><strong>Fault Line.</strong><span>Identify the deepest disagreement that cannot disappear without sacrificing something one side considers essential.</span></div>
          <div><strong>User Position.</strong><span>When the user has taken a position, identify its strongest support, assumptions, strongest objection, and what could require reconsideration.</span></div>
        </div>
        <p>
          The aim is disciplined inquiry rather than performance. The same structure can produce a finding, a qualified judgment, a genuine impasse, or a question important enough that the table should pause before synthesis.
        </p>
      </>
    ),
  },
  {
    id: "fault-line",
    index: "05",
    title: "The Fault Line",
    abstract:
      "Disagreement is not a failure of the system. The Fault Line identifies the point at which serious positions cannot be reconciled without giving something up.",
    action: "Enter the Fault Line",
    icon: <Scale size={19} aria-hidden="true" />,
    sourceBasis: "Round Table Constitution · Deliberation Protocol F–G",
    body: (
      <>
        <p>
          Many discussions become intellectually dishonest at precisely the moment they begin to sound harmonious. Different traditions can reach similar conclusions for incompatible reasons, or disagree because they hold fundamentally different assumptions about freedom, responsibility, justice, personhood, authority, human nature, or moral obligation.
        </p>
        <p>
          The Council therefore does not require synthesis. Its method explicitly rejects false consensus and forced reconciliation.
        </p>
        <h3>Where something has to be surrendered</h3>
        <p>
          The <strong>Fault Line</strong> is the point where the disagreement becomes irreducible. One position may give priority to individual liberty while another understands obligation as fundamentally relational. One theory may judge an action principally through intention while another gives greater moral weight to consequence. Two positions may both invoke dignity while disagreeing about what dignity requires.
        </p>
        <p>
          At a genuine Fault Line, something valued by one side must be surrendered for the disagreement to disappear. When the user's own answer could materially change the reasoning, the moderator pauses the table rather than manufacturing a conclusion. A deliberation may end in agreement; it may also end with a precisely defined disagreement. Both are legitimate outcomes.
        </p>
      </>
    ),
  },
  {
    id: "sources",
    index: "06",
    title: "Sources & Attribution",
    abstract:
      "Primary texts outrank reputation. Historical context matters. The Council distinguishes what a thinker argued from what a modern application of that argument might imply.",
    action: "Examine the source standard",
    icon: <Library size={19} aria-hidden="true" />,
    sourceBasis: "Primary Source Guide · Round Table Constitution §§ 1–20",
    body: (
      <>
        <p>
          The Council operates under an explicit hierarchy of evidence. Primary texts and authoritative editions come first. Reputable scholarship is used where interpretation is difficult or contested. General summaries may provide orientation but do not outrank the source itself. Unsourced quotation collections and popular aphorisms are not evidence.
        </p>
        <p>
          That hierarchy matters because intellectual figures accumulate reputations that can replace their actual work. Plato becomes authoritarian. Kant becomes a machine for following rules. Camus becomes a spokesman for nihilism. Foucault becomes the proposition that everything is power. Complex traditions collapse into slogans.
        </p>
        <h3>Doctrine and application are separate claims</h3>
        <p>
          Historical thinkers are interpreted within their linguistic, political, religious, and intellectual setting before their ideas are applied to modern cases. Development across a thinker's career, contradictions, genre, audience, translation, and contested scholarly readings may all matter.
        </p>
        <div className="attribution-scale" aria-label="Attribution standard">
          <div><strong>Direct</strong><span>The source explicitly addresses the relevant principle or a closely analogous question.</span></div>
          <div><strong>Derived</strong><span>The modern application follows strongly from the documented framework, although the exact case was not addressed.</span></div>
          <div><strong>Speculative</strong><span>The connection is plausible but historically distant, incomplete, disputed, or dependent on substantial inference.</span></div>
        </div>
        <p>
          Greater historical distance requires greater caution. The system's authority therefore does not rest on famous names or confident prose. It rests on the traceability of the reasoning.
        </p>
      </>
    ),
  },
  {
    id: "integrity",
    index: "07",
    title: "Guardrails & Adversarial Integrity",
    abstract:
      "The Council is designed to resist flattery, caricature, quote-mining, convenient consensus, and conclusions that have never faced their strongest objection.",
    action: "Inspect the guardrails",
    icon: <ShieldCheck size={19} aria-hidden="true" />,
    sourceBasis: "Round Table Constitution §§ 1–25",
    body: (
      <>
        <p>
          The Council's Constitution governs how evidence and argument may be used. It requires historical context, translation caution where relevant, genre awareness, attention to contested interpretations, evidence weighting, and a clear separation between description and endorsement.
        </p>
        <p>
          It also preserves distinctions that moral argument routinely blurs. Explaining why an action occurred is not the same as justifying it. Recognizing structural causes does not automatically eliminate individual agency. Describing power does not imply approval of power. Understanding a person does not require absolving them.
        </p>
        <h3>Every strong claim must survive resistance</h3>
        <p>
          Before criticizing a position, the Council should present its strongest defensible form. Where possible, a philosophy is first tested against its own principles rather than immediately attacked from outside. Strong conclusions face the strongest objection, contrary evidence, internal contradictions, difficult cases, and the question of what would actually change the judgment.
        </p>
        <p>
          This discipline extends to the user. The Council is explicitly prohibited from selecting thinkers merely because they support a position the user already holds. It should identify allies, critics, hidden assumptions, and blind spots. Agreement is not validation; disagreement is not hostility.
        </p>
        <blockquote>
          When intellectual confidence exceeds the evidence, confidence must yield. Accuracy outranks theatricality.
        </blockquote>
      </>
    ),
  },
  {
    id: "membership",
    index: "08",
    title: "Membership & Guests",
    abstract:
      "The model can choose among authorized voices, but it cannot appoint its own Council. Permanent membership, guest admission, and non-seatable historical sources are governed separately.",
    action: "See who can sit at the table",
    icon: <Users size={19} aria-hidden="true" />,
    sourceBasis: "Council Roster · Artists & Witnesses · Round Table Constitution §§ 45–52",
    body: (
      <>
        <p>
          Permanent membership is controlled by the Council Roster and Artists & Witnesses documents. The language model selects among those authorized voices for relevance and productive disagreement; it does not have authority to create a new permanent member simply because someone has a body of work, appears in research, or would make an interesting argument.
        </p>
        <h3>Guests require a reason and a gate</h3>
        <p>
          A nonmember may be invited only when the permanent roster has a material intellectual blind spot and the proposed guest contributes a genuinely distinct framework, expertise, historical perspective, or lived witness. The guest must have adequate reliable sources, a clearly defined role, and enough evidence to support the same Direct, Derived, and Speculative attribution discipline used for permanent members. An appearance as a guest creates no future selection privilege.
        </p>
        <p>
          The model may propose a guest, but it cannot autonomously seat an unregistered outsider. The runtime validates the visible Table against the participant set authorized for that deliberation. A generated response that inserts an unauthorized participant is rejected rather than quietly displayed.
        </p>
        <h3>Researchable does not mean seatable</h3>
        <p>
          Some historical figures may be necessary subjects of serious inquiry while remaining categorically ineligible for deliberative standing. The Council calls these <strong>Historical Source Only</strong> figures. Their writings, speeches, ideologies, and historical actions may be examined and accurately reconstructed where relevant, but they cannot appear as permanent members, Artist Witnesses, or autonomous Guests at the Table.
        </p>
        <p>
          This category is intentionally narrow. It is not a blacklist for controversial or unpopular ideas. It applies at the extreme boundary where a central documented ideological or political project substantially rests on genocide or extermination, racial or ethnic supremacy and systematic dehumanization, denial of basic personhood on the basis of identity, mass political violence as a governing program, terrorism or organized violence against civilians as an ideological method, or comparable doctrines. Steelmanning a historical argument does not require granting its author moral authority at the table.
        </p>
        <h3>Corpus-mapped, not permanently complete</h3>
        <p>
          Permanent members are maintained through corpus maps: research-ready routes across their identifiable body of work, chronology, genre, attribution and provenance problems, authoritative archives, primary sources, and serious scholarship. “Corpus-Mapped” does not mean scholarship is finished or that every copyrighted work is stored by the Council. The maps remain auditable and revisable as scholarship and archives change.
        </p>
      </>
    ),
  },
  {
    id: "memory",
    index: "09",
    title: "Memory, Revision & Limits",
    abstract:
      "The Council can preserve cases and philosophical development without turning old conclusions into doctrine or quietly inventing a worldview for the user.",
    action: "See how the Council learns",
    icon: <BookOpen size={19} aria-hidden="true" />,
    sourceBasis: "Casebook · Adam's Notebook · Round Table Constitution § 23",
    body: (
      <>
        <p>
          The Council is designed to have a history. Significant deliberations can be preserved in a Casebook containing the factual context, question beneath the question, participants, strongest arguments, unresolved Fault Line, the moderator's human reading, the user's stated position, pressure on that position, open questions, and sources.
        </p>
        <p>
          Continuity creates its own intellectual risk: remembering something incorrectly can be more dangerous than forgetting it. The Notebook therefore uses provenance rules for the user's evolving philosophy. A position is explicit only when the user actually states it. Repeated patterns can be recorded as repeated implications. More uncertain interpretations remain tentative inferences.
        </p>
        <p>
          Contradictions are preserved rather than silently repaired. A later position may represent changed beliefs, different facts, competing values, or an unresolved inconsistency. Previous Council findings can inform later deliberations, but they operate as persuasive precedent rather than doctrine: they may be followed, distinguished, revised, or rejected.
        </p>
        <h3>Limits of the method</h3>
        <p>
          The Council is an interpretive system, not a resurrection of historical consciousness. It cannot know what a dead thinker would literally say about an event they never encountered. It cannot eliminate genuine scholarly disagreement. Its roster reflects editorial choices. Historical sources can be incomplete, contested, translated imperfectly, or interpreted differently by serious scholars. Generative AI introduces an additional possibility of error.
        </p>
        <p>
          The safeguards exist because those limitations cannot be wished away. Sources can be checked. Attributions can be challenged. Arguments can be reopened. Conclusions can be revised. The Council does not promise final answers; it attempts to make the reasoning behind an answer visible, contestable, and capable of correction.
        </p>
      </>
    ),
  },
];

function panelFromHash() {
  const id = window.location.hash.replace(/^#/, "");
  return PANELS.some((panel) => panel.id === id) ? id : null;
}

export function AboutPage() {
  const [selectedId, setSelectedId] = useState<string | null>(() => panelFromHash());
  const selected = useMemo(
    () => PANELS.find((panel) => panel.id === selectedId) ?? null,
    [selectedId],
  );

  useEffect(() => {
    const onHashChange = () => setSelectedId(panelFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [selectedId]);

  function openPanel(id: string) {
    setSelectedId(id);
    window.location.hash = id;
  }

  function closePanel() {
    setSelectedId(null);
    window.history.replaceState(null, "", "/about");
  }

  return (
    <main className="shell about-shell">
      <header className="topbar about-topbar">
        <a className="brand" href="/" aria-label="The Council of Time home">
          <span className="mark" aria-hidden="true">C</span>
          <span>
            <strong>The Council of Time</strong>
            <small>Questions worth arguing about</small>
          </span>
        </a>
        <a className="ghost-button about-table-link" href="/">
          <ArrowLeft size={15} aria-hidden="true" /> Return to the table
        </a>
      </header>

      {!selected ? (
        <section className="about-overview" aria-labelledby="about-title">
          <div className="about-intro">
            <div className="eyebrow"><Library size={14} aria-hidden="true" /> Methodology & design</div>
            <h1 id="about-title">About the Council</h1>
            <p className="about-deck">
              The Council of Time is a source-grounded system for examining difficult questions through competing philosophical, moral, political, religious, and artistic traditions.
            </p>
            <p className="about-intro-copy">
              Historical thinkers are not treated as characters with invented opinions. Their documented ideas are reconstructed from primary texts and reputable scholarship, placed into genuine disagreement, and applied to contemporary questions with explicit limits on what can responsibly be attributed to them.
            </p>
            <div className="about-thesis">
              <span>The objective is not consensus.</span>
              <strong>It is clearer thinking.</strong>
            </div>
          </div>

          <div className="about-panel-grid" aria-label="Council methodology">
            {PANELS.map((panel) => (
              <button
                key={panel.id}
                type="button"
                className="about-panel"
                onClick={() => openPanel(panel.id)}
                aria-label={`${panel.title}: ${panel.action}`}
              >
                <span className="about-panel-head">
                  <span className="about-panel-icon">{panel.icon}</span>
                  <span className="about-panel-index">{panel.index}</span>
                </span>
                <span className="about-panel-title">{panel.title}</span>
                <span className="about-panel-abstract">{panel.abstract}</span>
                <span className="about-panel-action">{panel.action} <ArrowRight size={14} aria-hidden="true" /></span>
              </button>
            ))}
          </div>

          <section className="about-technical" aria-labelledby="technical-title">
            <div className="about-technical-icon"><Braces size={18} aria-hidden="true" /></div>
            <div>
              <div className="section-kicker">Technical architecture</div>
              <h2 id="technical-title">The scholarship is methodological. The machinery is modern.</h2>
              <p>
                The Council is a layered AI application: structured governing documents constrain the reasoning; a curated source architecture grounds attribution; an AI model performs the deliberative work; and the interface exposes sources, uncertainty, and the Fault Line rather than hiding them.
              </p>
              <div className="about-stack" aria-label="Technical stack">
                <span>React + Vite</span><span>GitHub</span><span>Cloudflare Workers</span><span>Workers AI</span>
              </div>
            </div>
          </section>

          <section className="about-audit-note" aria-label="Methodological commitment">
            <ShieldCheck size={18} aria-hidden="true" />
            <p><strong>The method is meant to be inspectable.</strong> The Council's authority is never supposed to come from the confidence of its prose. It comes from source discipline, explicit attribution, adversarial testing, visible uncertainty, and the ability to reopen a conclusion.</p>
          </section>
        </section>
      ) : (
        <article className="about-detail" aria-labelledby="about-detail-title">
          <button className="about-back" type="button" onClick={closePanel}>
            <ArrowLeft size={15} aria-hidden="true" /> All methodology
          </button>

          <header className="about-detail-header">
            <div className="about-detail-meta">
              <span className="about-panel-icon">{selected.icon}</span>
              <span>{selected.index}</span>
            </div>
            <h1 id="about-detail-title">{selected.title}</h1>
            <p>{selected.abstract}</p>
          </header>

          <div className="about-detail-body">{selected.body}</div>

          <footer className="about-source-basis">
            <div className="section-kicker">Methodological basis</div>
            <p>{selected.sourceBasis}</p>
            <button type="button" onClick={closePanel}>Return to About the Council</button>
          </footer>
        </article>
      )}
    </main>
  );
}