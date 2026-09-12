import { EXTENDED_SOURCE_CATALOG } from "./extendedSources";

export type PublicSource = {
  id: string;
  title: string;
  url: string;
  kind: "primary" | "scholarship" | "official";
  tags: string[];
  anchors?: string[];
  note: string;
};

const CORE_SOURCE_CATALOG: PublicSource[] = [
  {
    id: "S1",
    title: "Plato — public-domain works (Project Gutenberg)",
    url: "https://www.gutenberg.org/ebooks/author/93",
    kind: "primary",
    anchors: ["plato"],
    tags: ["justice", "virtue", "soul", "truth", "politics", "knowledge", "love"],
    note: "Use Plato through the dialogues and their arguments, irony, and tensions. Do not reduce him to rule by elites or treat a dialogue character as a simple mouthpiece for settled doctrine.",
  },
  {
    id: "S2",
    title: "Stanford Encyclopedia of Philosophy — Plato",
    url: "https://plato.stanford.edu/entries/plato/",
    kind: "scholarship",
    anchors: ["plato"],
    tags: ["justice", "virtue", "politics", "knowledge", "soul"],
    note: "Use for scholarly context and contested interpretation of Plato; preserve the dialogical complexity of the corpus.",
  },
  {
    id: "S3",
    title: "Confucius — Analects (Chinese Text Project)",
    url: "https://ctext.org/analects",
    kind: "primary",
    anchors: ["confucius"],
    tags: ["family", "duty", "ritual", "relationship", "respect", "character", "care", "conduct"],
    note: "Confucian ethics centers moral cultivation, humane conduct, family and social roles, and ritual practice. Do not collapse it into obedience or conformity.",
  },
  {
    id: "S4",
    title: "Stanford Encyclopedia of Philosophy — Confucius",
    url: "https://plato.stanford.edu/entries/confucius/",
    kind: "scholarship",
    anchors: ["confucius"],
    tags: ["family", "duty", "ritual", "relationship", "character", "respect"],
    note: "Use for interpretation of Confucian cultivation and relational ethics; avoid treating Western moral categories as exact equivalents.",
  },
  {
    id: "S5",
    title: "Kant — Groundwork of the Metaphysics of Morals (Project Gutenberg)",
    url: "https://www.gutenberg.org/ebooks/5682",
    kind: "primary",
    anchors: ["kant", "immanuel kant"],
    tags: ["duty", "autonomy", "dignity", "lying", "promise", "obligation", "respect", "person"],
    note: "Ground claims in autonomy, rational agency, dignity, duty, and treating persons as ends. Kant is not merely rigid rule-following regardless of context.",
  },
  {
    id: "S6",
    title: "Stanford Encyclopedia of Philosophy — Kant's Moral Philosophy",
    url: "https://plato.stanford.edu/entries/kant-moral/",
    kind: "scholarship",
    anchors: ["kant", "immanuel kant"],
    tags: ["duty", "autonomy", "dignity", "morality", "obligation", "respect", "person"],
    note: "Use for careful interpretation of Kantian duty, autonomy, dignity, and universal law; avoid the caricature that Kant is simply 'rules no matter what.'",
  },
  {
    id: "S7",
    title: "John Stuart Mill — On Liberty (Project Gutenberg)",
    url: "https://www.gutenberg.org/ebooks/34901",
    kind: "primary",
    anchors: ["mill", "john stuart mill"],
    tags: ["liberty", "harm", "freedom", "coercion", "society", "individuality"],
    note: "Use Mill for liberty, coercion, harm, individuality, and social power. Do not turn every moral question into a crude utility calculation.",
  },
  {
    id: "S8",
    title: "Stanford Encyclopedia of Philosophy — John Stuart Mill",
    url: "https://plato.stanford.edu/entries/mill/",
    kind: "scholarship",
    anchors: ["mill", "john stuart mill"],
    tags: ["liberty", "harm", "consequences", "utility", "freedom", "individuality"],
    note: "Use for Mill's liberty and utilitarian thought in context; distinguish liberty arguments from consequentialist arguments rather than blending them casually.",
  },
  {
    id: "S9",
    title: "Stanford Encyclopedia of Philosophy — Hannah Arendt",
    url: "https://plato.stanford.edu/entries/arendt/",
    kind: "scholarship",
    anchors: ["arendt", "hannah arendt"],
    tags: ["responsibility", "judgment", "evil", "politics", "public", "thoughtlessness", "plurality", "action"],
    note: "Use Arendt for judgment, responsibility, plurality, action, public life, and thoughtlessness. Do not reduce her account of evil to a slogan or imply that explanation erases responsibility.",
  },
  {
    id: "S10",
    title: "Stanford Encyclopedia of Philosophy — Simone de Beauvoir",
    url: "https://plato.stanford.edu/entries/beauvoir/",
    kind: "scholarship",
    anchors: ["beauvoir", "simone de beauvoir"],
    tags: ["freedom", "ambiguity", "relationship", "oppression", "gender", "responsibility", "love", "reciprocity"],
    note: "Use Beauvoir for freedom, ambiguity, oppression, embodiment, reciprocity, and responsibility. Do not reduce her to gender alone.",
  },
  {
    id: "S11",
    title: "Stanford Encyclopedia of Philosophy — Albert Camus",
    url: "https://plato.stanford.edu/entries/camus/",
    kind: "scholarship",
    anchors: ["camus", "albert camus"],
    tags: ["absurd", "rebellion", "solidarity", "dignity", "limits", "meaning", "mortality"],
    note: "Camus is not 'nothing matters.' Center absurdity, rebellion, solidarity, dignity, mortality, and limits; do not infer nihilism from the absurd.",
  },
  {
    id: "S12",
    title: "Internet Encyclopedia of Philosophy — Søren Kierkegaard",
    url: "https://iep.utm.edu/kierkega/",
    kind: "scholarship",
    anchors: ["kierkegaard", "søren kierkegaard", "soren kierkegaard"],
    tags: ["choice", "faith", "anxiety", "despair", "responsibility", "love", "commitment", "self"],
    note: "Use Kierkegaard for choice, faith, despair, responsibility, selfhood, and love. Distinguish pseudonymous works and do not flatten the corpus into generic existentialism.",
  },
  {
    id: "S13",
    title: "bell hooks — author page and works (Routledge)",
    url: "https://www.routledge.com/authors/i15071-bell-hooks",
    kind: "official",
    anchors: ["bell hooks", "hooks"],
    tags: ["love", "domination", "patriarchy", "relationship", "care", "contempt", "community", "power"],
    note: "Use hooks on love as an ethical practice entangled with domination, patriarchy, care, and community. Do not reduce her to the slogan that 'love matters.'",
  },
  {
    id: "S14",
    title: "James Baldwin — collection guide (Library of Congress)",
    url: "https://www.loc.gov/item/mm93082233/",
    kind: "official",
    anchors: ["baldwin", "james baldwin"],
    tags: ["love", "hatred", "innocence", "identity", "race", "self-deception", "america", "responsibility"],
    note: "Use Baldwin as a moral witness on love, hatred, innocence, identity, self-deception, race, and American hypocrisy. Do not collapse his work into 'love conquers hate.'",
  },
  {
    id: "S15",
    title: "Michel Foucault — Stanford Encyclopedia of Philosophy",
    url: "https://plato.stanford.edu/entries/foucault/",
    kind: "scholarship",
    anchors: ["foucault", "michel foucault"],
    tags: ["power", "discipline", "surveillance", "normalization", "institution", "knowledge", "sexuality"],
    note: "Use Foucault for institutions, discipline, surveillance, normalization, knowledge, sexuality, and power. Do not turn 'power is everywhere' into 'everything is only power,' and do not infer endorsement from description.",
  },
  {
    id: "S16",
    title: "Frantz Fanon — Stanford Encyclopedia of Philosophy",
    url: "https://plato.stanford.edu/entries/frantz-fanon/",
    kind: "scholarship",
    anchors: ["fanon", "frantz fanon"],
    tags: ["colonialism", "violence", "liberation", "racism", "dehumanization", "domination", "identity"],
    note: "Use Fanon for colonialism, racism, dehumanization, liberation, and the psychic effects of domination. Do not reduce him to a blanket endorsement of violence.",
  },
  {
    id: "S17",
    title: "Martha Nussbaum — capabilities approach (Stanford Encyclopedia of Philosophy)",
    url: "https://plato.stanford.edu/entries/capability-approach/",
    kind: "scholarship",
    anchors: ["nussbaum", "martha nussbaum"],
    tags: ["dignity", "emotion", "justice", "flourishing", "forgiveness", "anger", "capability", "vulnerability"],
    note: "Use Nussbaum for capabilities, flourishing, dignity, emotion, vulnerability, anger, and forgiveness. Do not caricature her as simply preferring compassion to punishment.",
  },
  {
    id: "S18",
    title: "Nāgārjuna — Stanford Encyclopedia of Philosophy",
    url: "https://plato.stanford.edu/entries/nagarjuna/",
    kind: "scholarship",
    anchors: ["nāgārjuna", "nagarjuna"],
    tags: ["emptiness", "attachment", "identity", "suffering", "interdependence", "self", "impermanence"],
    note: "Emptiness does not mean nihilism or that nothing matters. Use Nāgārjuna through dependent origination, emptiness, attachment, and the critique of fixed essence; avoid forcing Western metaphysical categories onto the argument.",
  },
];

export const SOURCE_CATALOG: PublicSource[] = [...CORE_SOURCE_CATALOG, ...EXTENDED_SOURCE_CATALOG];

const TOPIC_BUNDLES: Array<{ keywords: string[]; ids: string[] }> = [
  {
    keywords: ["love", "marriage", "relationship", "contempt", "betrayal", "forgive", "forgiveness", "repair", "intimacy", "partner", "family"],
    ids: ["S13", "S12", "S10", "S14", "S23", "S27", "S17", "S3", "S6"],
  },
  {
    keywords: ["power", "coercion", "institution", "surveillance", "prison", "domination", "oppression", "colonial", "racism", "abolition"],
    ids: ["S25", "S15", "S16", "S22", "S23", "S26", "S9", "S17", "S8", "S10"],
  },
  {
    keywords: ["justice", "politics", "democracy", "state", "law", "rights", "liberty", "freedom", "public", "citizenship"],
    ids: ["S22", "S27", "S19", "S20", "S21", "S25", "S2", "S6", "S8", "S9", "S15", "S17"],
  },
  {
    keywords: ["meaning", "death", "mortality", "grief", "despair", "absurd", "faith", "suffering", "anxiety", "insecurity"],
    ids: ["S11", "S12", "S24", "S18", "S14", "S20", "S17"],
  },
  {
    keywords: ["identity", "self", "ego", "attachment", "gender", "embodiment", "recognition", "difference"],
    ids: ["S18", "S24", "S26", "S10", "S22", "S23", "S14", "S16", "S12", "S15"],
  },
  {
    keywords: ["duty", "promise", "lying", "obligation", "responsibility", "respect", "dignity", "culpability", "mercy", "repentance"],
    ids: ["S5", "S6", "S19", "S20", "S9", "S17", "S3"],
  },
  {
    keywords: ["religion", "faith", "revelation", "theology", "reason", "scripture", "interpretation"],
    ids: ["S19", "S20", "S21", "S12", "S3"],
  },
  {
    keywords: ["race", "racism", "black", "america", "democracy", "segregation", "reconstruction"],
    ids: ["S22", "S14", "S23", "S25", "S27", "S16", "S9"],
  },
  {
    keywords: ["work", "labor", "restaurant", "kitchen", "hospitality", "class", "travel", "food", "culture", "craft"],
    ids: ["S28", "S29", "S15", "S27", "S14"],
  },
];

const GENERAL_IDS = ["S6", "S9", "S11", "S12", "S17", "S19", "S22"];
const MODERATOR_IDS = ["S28", "S29"];

function includesAny(text: string, values: string[]) {
  return values.some((value) => text.includes(value));
}

export function selectSources(text: string, max = 9): PublicSource[] {
  const normalized = text.toLowerCase();
  const bundleScores = new Map<string, number>();

  for (const bundle of TOPIC_BUNDLES) {
    if (!includesAny(normalized, bundle.keywords)) continue;
    bundle.ids.forEach((id, index) => {
      bundleScores.set(id, (bundleScores.get(id) || 0) + Math.max(1, 10 - index));
    });
  }

  const scored = SOURCE_CATALOG.map((source, catalogIndex) => {
    const explicit = source.anchors && includesAny(normalized, source.anchors) ? 40 : 0;
    const tagScore = source.tags.reduce((total, tag) => total + (normalized.includes(tag) ? 3 : 0), 0);
    const bundleScore = bundleScores.get(source.id) || 0;
    const primaryBonus = explicit > 0 && source.kind === "primary" ? 3 : 0;
    return { source, score: explicit + tagScore + bundleScore + primaryBonus, catalogIndex };
  }).sort((a, b) => b.score - a.score || a.catalogIndex - b.catalogIndex);

  const matched = scored
    .filter((item) => item.score > 0 && !MODERATOR_IDS.includes(item.source.id))
    .map((item) => item.source);
  const general = GENERAL_IDS.map((id) => SOURCE_CATALOG.find((source) => source.id === id)).filter(Boolean) as PublicSource[];
  const topicLimit = Math.max(1, max - MODERATOR_IDS.length);
  const topicSources = [...new Map([...matched, ...general].map((source) => [source.id, source])).values()].slice(0, topicLimit);
  const moderatorSources = MODERATOR_IDS.map((id) => SOURCE_CATALOG.find((source) => source.id === id)).filter(Boolean) as PublicSource[];

  return [...topicSources, ...moderatorSources].slice(0, max);
}
