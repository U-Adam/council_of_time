import { ARTIST_WITNESS_IDS, ensureArtistWitness } from "./artistWitness";
import { THINKER_SOURCE_CATALOG, conceptsFor, selectSourcesV2 } from "./selection";
import { sourceMeta, voiceForSource } from "./sourceMeta";
import type { PublicSource } from "./sources";

const MAJOR_TOPIC_PATTERN = /\b(immigration|immigrant|migration|migrant|border|refugee|asylum|politic|election|democracy|government|state|law|rights|war|climate|racism|race|economy|economic|capital|labor|poverty|justice|religion|abortion|gun|police|prison|healthcare|education)\b/i;
const MIGRATION_PATTERN = /\b(immigration|immigrant|migration|migrant|border|refugee|asylum|undocumented|unauthorized)\b/i;

function normalize(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function recommendedThinkerCount(text: string) {
  if (MAJOR_TOPIC_PATTERN.test(text) || text.trim().length >= 180) return 6;
  return 5;
}

function planningConcepts(text: string) {
  const concepts = new Set(conceptsFor(text));

  if (MIGRATION_PATTERN.test(text)) {
    [
      "law",
      "sovereignty",
      "citizenship",
      "rights",
      "freedom",
      "justice",
      "institutions",
      "dignity",
      "labor",
      "community",
      "power",
      "public life",
    ].forEach((concept) => concepts.add(concept));
  }

  return concepts;
}

function sourcePlanningScore(source: PublicSource, text: string, concepts: Set<string>, contextTags: Set<string>) {
  const normalizedText = normalize(text);
  let score = 0;

  for (const tag of source.tags) {
    const normalizedTag = normalize(tag);
    if (normalizedText.includes(normalizedTag)) score += 8;
    if (contextTags.has(normalizedTag)) score += 1.5;

    for (const concept of concepts) {
      if (normalizedTag.includes(concept) || concept.includes(normalizedTag)) score += 3;
    }
  }

  return score;
}

function padThinkers(
  sources: PublicSource[],
  text: string,
  targetThinkers: number,
) {
  const expanded = [...sources];
  const seenVoices = new Set<string>();
  const contextTags = new Set(expanded.flatMap((source) => source.tags.map(normalize)));

  for (const source of expanded) {
    const meta = sourceMeta(source.id);
    const voice = voiceForSource(source.id);
    if (meta?.role === "thinker" && voice) seenVoices.add(voice);
  }

  if (seenVoices.size >= targetThinkers) return expanded;

  const concepts = planningConcepts(text);
  const candidates = THINKER_SOURCE_CATALOG
    .map((source) => {
      const meta = sourceMeta(source.id);
      const voice = voiceForSource(source.id);
      return {
        source,
        meta,
        voice,
        score: sourcePlanningScore(source, text, concepts, contextTags),
      };
    })
    .filter(
      (candidate) =>
        candidate.meta?.role === "thinker" &&
        candidate.voice &&
        !seenVoices.has(candidate.voice),
    )
    .sort((a, b) => b.score - a.score || String(a.voice).localeCompare(String(b.voice)));

  for (const candidate of candidates) {
    if (seenVoices.size >= targetThinkers) break;
    if (!candidate.voice) continue;
    expanded.push(candidate.source);
    seenVoices.add(candidate.voice);
  }

  return expanded;
}

export function createTablePlan(
  text: string,
  maxVoices = recommendedThinkerCount(text),
  recentSourceIds: string[] = [],
) {
  const selected = selectSourcesV2(text, 9, recentSourceIds);
  const padded = padThinkers(selected, text, maxVoices);
  const sources = ensureArtistWitness(
    padded,
    text,
    9,
    recentSourceIds,
  );
  const voices: string[] = [];
  const seen = new Set<string>();
  const artistSource = sources.find((source) => ARTIST_WITNESS_IDS.has(source.id));
  const artistWitness = artistSource ? voiceForSource(artistSource.id) || artistSource.title.split(" — ")[0] : null;

  for (const source of sources) {
    const meta = sourceMeta(source.id);
    const voice = voiceForSource(source.id);
    if (!voice || !meta || meta.role !== "thinker" || seen.has(voice)) continue;
    seen.add(voice);
    voices.push(voice);
    if (voices.length >= maxVoices) break;
  }

  return {
    voices,
    artistWitness,
    moderator: "Anthony Bourdain",
    minimumParticipants: Math.min(9, voices.length + (artistWitness ? 1 : 0)),
    depth: maxVoices >= 6 ? "major" : "standard",
    sourceIds: sources.map((source) => source.id),
  };
}
