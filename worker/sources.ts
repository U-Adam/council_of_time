export type PublicSource = {
  id: string;
  title: string;
  url: string;
  kind: "primary" | "scholarship" | "official";
  tags: string[];
};

export const SOURCE_CATALOG: PublicSource[] = [
  {
    id: "S1",
    title: "Plato — public-domain works (Project Gutenberg)",
    url: "https://www.gutenberg.org/ebooks/author/93",
    kind: "primary",
    tags: ["plato", "justice", "virtue", "soul", "truth", "politics"],
  },
  {
    id: "S2",
    title: "Stanford Encyclopedia of Philosophy — Plato",
    url: "https://plato.stanford.edu/entries/plato/",
    kind: "scholarship",
    tags: ["plato", "justice", "virtue", "politics", "knowledge"],
  },
  {
    id: "S3",
    title: "Confucius — Analects (Chinese Text Project)",
    url: "https://ctext.org/analects",
    kind: "primary",
    tags: ["confucius", "family", "duty", "ritual", "relationship", "respect", "character"],
  },
  {
    id: "S4",
    title: "Stanford Encyclopedia of Philosophy — Confucius",
    url: "https://plato.stanford.edu/entries/confucius/",
    kind: "scholarship",
    tags: ["confucius", "family", "duty", "ritual", "relationship", "character"],
  },
  {
    id: "S5",
    title: "Kant — Groundwork of the Metaphysics of Morals (Project Gutenberg)",
    url: "https://www.gutenberg.org/ebooks/5682",
    kind: "primary",
    tags: ["kant", "duty", "autonomy", "dignity", "lying", "promise", "obligation", "respect"],
  },
  {
    id: "S6",
    title: "Stanford Encyclopedia of Philosophy — Kant's Moral Philosophy",
    url: "https://plato.stanford.edu/entries/kant-moral/",
    kind: "scholarship",
    tags: ["kant", "duty", "autonomy", "dignity", "morality", "obligation"],
  },
  {
    id: "S7",
    title: "John Stuart Mill — On Liberty (Project Gutenberg)",
    url: "https://www.gutenberg.org/ebooks/34901",
    kind: "primary",
    tags: ["mill", "liberty", "harm", "freedom", "coercion", "society"],
  },
  {
    id: "S8",
    title: "Stanford Encyclopedia of Philosophy — John Stuart Mill",
    url: "https://plato.stanford.edu/entries/mill/",
    kind: "scholarship",
    tags: ["mill", "liberty", "harm", "consequences", "utility", "freedom"],
  },
  {
    id: "S9",
    title: "Stanford Encyclopedia of Philosophy — Hannah Arendt",
    url: "https://plato.stanford.edu/entries/arendt/",
    kind: "scholarship",
    tags: ["arendt", "responsibility", "judgment", "evil", "politics", "public", "thoughtlessness"],
  },
  {
    id: "S10",
    title: "Stanford Encyclopedia of Philosophy — Simone de Beauvoir",
    url: "https://plato.stanford.edu/entries/beauvoir/",
    kind: "scholarship",
    tags: ["beauvoir", "freedom", "ambiguity", "relationship", "oppression", "gender", "responsibility"],
  },
  {
    id: "S11",
    title: "Stanford Encyclopedia of Philosophy — Albert Camus",
    url: "https://plato.stanford.edu/entries/camus/",
    kind: "scholarship",
    tags: ["camus", "absurd", "rebellion", "solidarity", "dignity", "limits", "meaning"],
  },
  {
    id: "S12",
    title: "Internet Encyclopedia of Philosophy — Søren Kierkegaard",
    url: "https://iep.utm.edu/kierkega/",
    kind: "scholarship",
    tags: ["kierkegaard", "choice", "faith", "anxiety", "despair", "responsibility", "love"],
  },
  {
    id: "S13",
    title: "bell hooks — author page and works (Routledge)",
    url: "https://www.routledge.com/authors/i15071-bell-hooks",
    kind: "official",
    tags: ["hooks", "love", "domination", "patriarchy", "relationship", "care", "contempt"],
  },
  {
    id: "S14",
    title: "James Baldwin — collection guide (Library of Congress)",
    url: "https://www.loc.gov/item/mm93082233/",
    kind: "official",
    tags: ["baldwin", "love", "hatred", "innocence", "identity", "race", "self-deception"],
  },
  {
    id: "S15",
    title: "Michel Foucault — Stanford Encyclopedia of Philosophy",
    url: "https://plato.stanford.edu/entries/foucault/",
    kind: "scholarship",
    tags: ["foucault", "power", "discipline", "surveillance", "normalization", "institution"],
  },
  {
    id: "S16",
    title: "Frantz Fanon — Stanford Encyclopedia of Philosophy",
    url: "https://plato.stanford.edu/entries/frantz-fanon/",
    kind: "scholarship",
    tags: ["fanon", "colonialism", "violence", "liberation", "racism", "dehumanization"],
  },
  {
    id: "S17",
    title: "Martha Nussbaum — capabilities approach (Stanford Encyclopedia of Philosophy)",
    url: "https://plato.stanford.edu/entries/capability-approach/",
    kind: "scholarship",
    tags: ["nussbaum", "dignity", "emotion", "justice", "flourishing", "forgiveness", "anger"],
  },
  {
    id: "S18",
    title: "Nāgārjuna — Stanford Encyclopedia of Philosophy",
    url: "https://plato.stanford.edu/entries/nagarjuna/",
    kind: "scholarship",
    tags: ["nagarjuna", "emptiness", "attachment", "identity", "suffering", "interdependence"],
  },
];

const DEFAULT_IDS = ["S6", "S8", "S9", "S11"];

export function selectSources(text: string, max = 7): PublicSource[] {
  const normalized = text.toLowerCase();
  const scored = SOURCE_CATALOG.map((source) => ({
    source,
    score: source.tags.reduce((total, tag) => total + (normalized.includes(tag) ? 2 : 0), 0),
  })).sort((a, b) => b.score - a.score);

  const matched = scored.filter((item) => item.score > 0).map((item) => item.source);
  const defaults = DEFAULT_IDS.map((id) => SOURCE_CATALOG.find((source) => source.id === id)).filter(Boolean) as PublicSource[];
  const combined = [...matched, ...defaults];
  return [...new Map(combined.map((source) => [source.id, source])).values()].slice(0, max);
}
