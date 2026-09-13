import { ARTIST_SOURCE_CATALOG as LEGACY_ARTIST_SOURCE_CATALOG } from "./artistSources";
import { EXPANDED_ARTIST_SOURCE_CATALOG } from "./expandedArtistSources";
import { ROSTER_SOURCE_CATALOG } from "./rosterSources";
import { SOURCE_CATALOG as LEGACY_SOURCE_CATALOG, type PublicSource } from "./sources";
import { sourceMeta, voiceForSource } from "./sourceMeta";

export const THINKER_SOURCE_CATALOG: PublicSource[] = [...LEGACY_SOURCE_CATALOG, ...ROSTER_SOURCE_CATALOG];
export const ARTIST_SOURCE_CATALOG_V2: PublicSource[] = [
  ...LEGACY_ARTIST_SOURCE_CATALOG,
  ...EXPANDED_ARTIST_SOURCE_CATALOG,
];
export const ALL_SOURCE_CATALOG_V2: PublicSource[] = [
  ...THINKER_SOURCE_CATALOG,
  ...ARTIST_SOURCE_CATALOG_V2,
];
export const ARTIST_WITNESS_IDS_V2 = new Set(ARTIST_SOURCE_CATALOG_V2.map((source) => source.id));

const MODERATOR_IDS = new Set(["S28", "S29"]);
const CASE_IDS = new Set(["S38", "S39"]);
const RELEVANCE_TIE_WINDOW = 5;

const AMBIGUOUS_ANCHORS = new Set([
  "west",
  "hooks",
  "butler",
  "davis",
  "lorde",
  "watts",
  "graham",
  "james",
  "smith",
]);

const STOPWORDS = new Set([
  "about", "after", "again", "against", "because", "before", "being", "between", "could", "does", "from",
  "have", "into", "more", "most", "other", "should", "some", "than", "that", "their", "there", "these", "they",
  "this", "those", "through", "under", "what", "when", "where", "which", "while", "with", "would", "your", "ours",
]);

const CONCEPT_BUNDLES: Array<{ keywords: string[]; concepts: string[] }> = [
  {
    keywords: ["love", "marriage", "relationship", "contempt", "betrayal", "forgive", "forgiveness", "repair", "intimacy", "partner", "family", "trust"],
    concepts: ["love", "relationship", "care", "reciprocity", "dignity", "respect", "domination", "intimacy", "family", "trust", "forgiveness", "responsibility"],
  },
  {
    keywords: ["power", "coercion", "institution", "surveillance", "prison", "domination", "oppression", "colonial", "racism", "abolition", "hierarchy"],
    concepts: ["power", "coercion", "institution", "domination", "oppression", "colonialism", "racism", "liberation", "sovereignty", "law", "violence"],
  },
  {
    keywords: ["justice", "politics", "democracy", "state", "law", "rights", "liberty", "freedom", "public", "citizenship", "fair", "fairness", "equality"],
    concepts: ["justice", "liberty", "freedom", "rights", "democracy", "citizenship", "law", "legitimacy", "fairness", "equality", "public reason", "institutions"],
  },
  {
    keywords: ["meaning", "death", "mortality", "grief", "despair", "absurd", "faith", "suffering", "anxiety", "hope"],
    concepts: ["meaning", "mortality", "suffering", "hope", "faith", "despair", "absurd", "dignity", "grief", "responsibility", "impermanence"],
  },
  {
    keywords: ["identity", "self", "ego", "attachment", "gender", "embodiment", "recognition", "difference", "reinvention", "authenticity"],
    concepts: ["identity", "self", "attachment", "gender", "embodiment", "recognition", "difference", "authenticity", "self-invention", "social norms", "performance"],
  },
  {
    keywords: ["duty", "promise", "lying", "obligation", "responsibility", "respect", "dignity", "culpability", "mercy", "repentance", "accountability"],
    concepts: ["duty", "obligation", "responsibility", "respect", "dignity", "culpability", "mercy", "repentance", "autonomy", "conscience", "judgment"],
  },
  {
    keywords: ["religion", "faith", "revelation", "theology", "scripture", "god", "spiritual", "sacred"],
    concepts: ["religion", "faith", "revelation", "law", "interpretation", "reason", "conscience", "humility", "meaning"],
  },
  {
    keywords: ["race", "racism", "black", "segregation", "reconstruction", "whiteness", "slavery"],
    concepts: ["race", "racism", "history", "citizenship", "democracy", "power", "identity", "colonialism", "segregation", "sovereignty", "memory"],
  },
  {
    keywords: ["work", "labor", "job", "restaurant", "kitchen", "hospitality", "class", "wage", "poverty", "capital", "market", "exploitation", "alienation"],
    concepts: ["work", "labor", "class", "dignity", "exploitation", "alienation", "capital", "poverty", "markets", "inequality", "institutions", "community"],
  },
  {
    keywords: ["science", "evidence", "empirical", "physics", "biology", "psychology", "evolution", "technology", "expert", "expertise", "uncertainty"],
    concepts: ["science", "evidence", "uncertainty", "explanation", "expertise", "technology", "responsibility", "causation", "inference", "truth", "public responsibility"],
  },
  {
    keywords: ["climate", "environment", "ecology", "land", "country", "future generations", "conservation", "nature"],
    concepts: ["climate justice", "environment", "ecology", "land", "country", "future generations", "conservation", "kinship", "responsibility", "custodianship", "sovereignty"],
  },
  {
    keywords: ["truth", "lie", "propaganda", "language", "knowledge", "belief", "information", "media", "speech"],
    concepts: ["truth", "language", "knowledge", "belief", "propaganda", "intellectual honesty", "judgment", "public", "power", "interpretation"],
  },
  {
    keywords: ["loyalty", "cowardice", "courage", "complicity", "obedience", "allegiance"],
    concepts: ["duty", "commitment", "courage", "responsibility", "complicity", "solidarity", "family", "authority", "truth", "judgment", "rebellion"],
  },
  {
    keywords: ["leader", "leadership", "war", "crisis", "statesman", "statesmanship", "empire"],
    concepts: ["leadership", "war", "history", "judgment", "responsibility", "violence", "power", "democracy", "memory", "myth", "public life"],
  },
];

const GENERALIST_IDS = ["S3", "S5", "S7", "S10", "S17", "S18", "S40", "S44", "S52", "S54", "S59"];

function normalize(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function tokenize(value: string) {
  return new Set(
    normalize(value)
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 4 && !STOPWORDS.has(token)),
  );
}

function phrasePresent(text: string, phrase: string) {
  const normalizedText = normalize(text);
  const normalizedPhrase = normalize(phrase).trim();
  if (!normalizedPhrase) return false;
  const escaped = normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(normalizedText);
}

function stableNumber(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash / 0xffffffff;
}

export function conceptsFor(text: string) {
  const concepts = new Set<string>();
  for (const bundle of CONCEPT_BUNDLES) {
    if (!bundle.keywords.some((keyword) => phrasePresent(text, keyword))) continue;
    bundle.concepts.forEach((concept) => concepts.add(normalize(concept)));
  }
  return concepts;
}

function isExplicitAnchor(source: PublicSource, text: string) {
  return (source.anchors || []).some((anchor) => {
    const normalizedAnchor = normalize(anchor);
    if (AMBIGUOUS_ANCHORS.has(normalizedAnchor)) return false;
    return phrasePresent(text, anchor);
  });
}

function tagConceptMatch(tag: string, concepts: Set<string>) {
  const normalizedTag = normalize(tag);
  const tagTokens = tokenize(tag);
  let matches = 0;
  for (const concept of concepts) {
    if (normalizedTag.includes(concept)) {
      matches += 1;
      continue;
    }
    const conceptTokens = tokenize(concept);
    if ([...conceptTokens].some((token) => tagTokens.has(token))) matches += 1;
  }
  return matches;
}

function scoreSource(source: PublicSource, text: string, concepts: Set<string>) {
  const questionTokens = tokenize(text);
  const explicit = isExplicitAnchor(source, text);
  let score = explicit ? 100 : 0;

  for (const tag of source.tags) {
    if (phrasePresent(text, tag)) score += 10;
    const tagTokens = tokenize(tag);
    const tokenOverlap = [...tagTokens].filter((token) => questionTokens.has(token)).length;
    score += tokenOverlap * 2;
    score += tagConceptMatch(tag, concepts) * 3;
  }

  return { score, explicit };
}

function recentVoiceCounts(recentSourceIds: string[]) {
  const counts = new Map<string, number>();
  for (const id of recentSourceIds) {
    const voice = voiceForSource(id);
    if (!voice) continue;
    counts.set(voice, (counts.get(voice) || 0) + 1);
  }
  return counts;
}

type MemberCandidate = {
  voice: string;
  family: string;
  score: number;
  explicit: boolean;
  source: PublicSource;
  tags: Set<string>;
};

function thinkerCandidates(text: string) {
  const concepts = conceptsFor(text);
  const grouped = new Map<string, MemberCandidate>();

  for (const source of THINKER_SOURCE_CATALOG) {
    const meta = sourceMeta(source.id);
    if (!meta || meta.role !== "thinker") continue;
    const scored = scoreSource(source, text, concepts);
    const existing = grouped.get(meta.voice);
    const candidate: MemberCandidate = {
      voice: meta.voice,
      family: meta.family,
      score: scored.score,
      explicit: scored.explicit,
      source,
      tags: new Set(source.tags.map(normalize)),
    };
    if (!existing || candidate.score > existing.score || (candidate.score === existing.score && candidate.explicit && !existing.explicit)) {
      grouped.set(meta.voice, candidate);
    } else if (existing) {
      source.tags.forEach((tag) => existing.tags.add(normalize(tag)));
      existing.explicit = existing.explicit || scored.explicit;
    }
  }

  return [...grouped.values()];
}

function chooseCandidates(
  candidates: MemberCandidate[],
  count: number,
  recentSourceIds: string[],
  seed: string,
) {
  const selected: MemberCandidate[] = [];
  const remaining = [...candidates];
  const usedFamilies = new Set<string>();
  const coveredTags = new Set<string>();
  const recent = recentVoiceCounts(recentSourceIds);

  while (remaining.length && selected.length < count) {
    const maxRaw = Math.max(...remaining.map((candidate) => candidate.score));
    const nearBand = remaining.filter(
      (candidate) => candidate.explicit || candidate.score >= maxRaw - RELEVANCE_TIE_WINDOW,
    );

    nearBand.sort((a, b) => {
      const adjusted = (candidate: MemberCandidate) => {
        const diversity = usedFamilies.has(candidate.family) ? 0 : 3;
        const novelty = Math.min(2, [...candidate.tags].filter((tag) => !coveredTags.has(tag)).length * 0.2);
        const recentPenalty = candidate.explicit ? 0 : Math.min(8, (recent.get(candidate.voice) || 0) * 4);
        const jitter = stableNumber(`${seed}|${candidate.voice}`) * 0.8;
        return candidate.score + diversity + novelty - recentPenalty + jitter;
      };
      return adjusted(b) - adjusted(a) || b.score - a.score || a.voice.localeCompare(b.voice);
    });

    const winner = nearBand[0];
    selected.push(winner);
    usedFamilies.add(winner.family);
    winner.tags.forEach((tag) => coveredTags.add(tag));
    remaining.splice(remaining.findIndex((candidate) => candidate.voice === winner.voice), 1);
  }

  return selected;
}

function fallbackCandidates(existingVoices: Set<string>, text: string) {
  const offset = Math.floor(stableNumber(text) * GENERALIST_IDS.length);
  const orderedIds = GENERALIST_IDS.map((_, index) => GENERALIST_IDS[(offset + index) % GENERALIST_IDS.length]);
  const byId = new Map(THINKER_SOURCE_CATALOG.map((source) => [source.id, source]));
  const results: MemberCandidate[] = [];

  for (const id of orderedIds) {
    const source = byId.get(id);
    const meta = source && sourceMeta(id);
    if (!source || !meta || existingVoices.has(meta.voice)) continue;
    results.push({
      voice: meta.voice,
      family: meta.family,
      score: 0,
      explicit: false,
      source,
      tags: new Set(source.tags.map(normalize)),
    });
  }
  return results;
}

export function selectSourcesV2(text: string, max = 9, recentSourceIds: string[] = []): PublicSource[] {
  const concepts = conceptsFor(text);
  const moderatorSources = THINKER_SOURCE_CATALOG.filter((source) => MODERATOR_IDS.has(source.id));
  const caseSources = THINKER_SOURCE_CATALOG.filter(
    (source) => CASE_IDS.has(source.id) && scoreSource(source, text, concepts).explicit,
  );
  const availableThinkerSlots = Math.max(1, max - moderatorSources.length - caseSources.length);
  const candidates = thinkerCandidates(text).filter((candidate) => candidate.score > 0);
  const selected = chooseCandidates(candidates, availableThinkerSlots, recentSourceIds, text);

  const targetFloor = Math.min(3, availableThinkerSlots);
  if (selected.length < targetFloor) {
    const existing = new Set(selected.map((candidate) => candidate.voice));
    const fillers = chooseCandidates(
      fallbackCandidates(existing, text),
      targetFloor - selected.length,
      recentSourceIds,
      `${text}|fallback`,
    );
    selected.push(...fillers);
  }

  const topicalSources = selected.map((candidate) => candidate.source);
  return [...topicalSources, ...caseSources, ...moderatorSources].slice(0, max);
}

function artistContextScore(source: PublicSource, contextSources: PublicSource[], concepts: Set<string>) {
  const contextTags = new Set(contextSources.flatMap((item) => item.tags.map(normalize)));
  let score = 0;
  for (const tag of source.tags) {
    const normalizedTag = normalize(tag);
    if (contextTags.has(normalizedTag)) score += 2;
    score += tagConceptMatch(tag, concepts) * 1.2;
  }
  return Math.min(14, score);
}

export function selectArtistWitnessV2(
  text: string,
  contextSources: PublicSource[] = [],
  recentSourceIds: string[] = [],
): PublicSource {
  const contextText = `${text} ${contextSources.flatMap((source) => source.tags).join(" ")}`;
  const concepts = conceptsFor(contextText);
  const recent = recentVoiceCounts(recentSourceIds);
  const contextVoices = new Set(contextSources.map((source) => voiceForSource(source.id)).filter(Boolean));

  const candidates = ARTIST_SOURCE_CATALOG_V2.map((source) => {
    const meta = sourceMeta(source.id);
    const direct = scoreSource(source, text, conceptsFor(text));
    const contextScore = artistContextScore(source, contextSources, concepts);
    const duplicateThinkerVoice = Boolean(meta?.voice && contextVoices.has(meta.voice));
    const score = direct.score + contextScore - (duplicateThinkerVoice && !direct.explicit ? 20 : 0);
    return {
      source,
      voice: meta?.voice || source.title,
      score,
      explicit: direct.explicit,
    };
  });

  const maxRaw = Math.max(...candidates.map((candidate) => candidate.score));
  const nearBand = candidates.filter(
    (candidate) => candidate.explicit || candidate.score >= maxRaw - RELEVANCE_TIE_WINDOW,
  );

  nearBand.sort((a, b) => {
    const adjusted = (candidate: (typeof nearBand)[number]) => {
      const recentPenalty = candidate.explicit ? 0 : Math.min(10, (recent.get(candidate.voice) || 0) * 5);
      return candidate.score - recentPenalty + stableNumber(`${text}|artist|${candidate.voice}`) * 0.8;
    };
    return adjusted(b) - adjusted(a) || b.score - a.score || a.voice.localeCompare(b.voice);
  });

  return (nearBand[0] || candidates[0]).source;
}
