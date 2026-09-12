import { ARTIST_SOURCE_CATALOG } from "./artistSources";
import type { PublicSource } from "./sources";

export const ARTIST_WITNESS_IDS = new Set(ARTIST_SOURCE_CATALOG.map((source) => source.id));

function includesAny(text: string, values: string[] = []) {
  return values.some((value) => text.includes(value));
}

function stableIndex(text: string, length: number) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return length ? hash % length : 0;
}

export function selectArtistWitness(text: string, contextSources: PublicSource[] = []): PublicSource {
  const normalized = text.toLowerCase();
  const directScored = ARTIST_SOURCE_CATALOG.map((source, index) => ({
    source,
    index,
    score:
      (source.anchors && includesAny(normalized, source.anchors) ? 50 : 0) +
      source.tags.reduce((total, tag) => total + (normalized.includes(tag) ? 4 : 0), 0),
  })).sort((a, b) => b.score - a.score || a.index - b.index);

  if (directScored[0]?.score > 0) return directScored[0].source;

  const contextTags = new Set(
    contextSources
      .filter((source) => !["S28", "S29"].includes(source.id))
      .slice(0, 4)
      .flatMap((source) => source.tags),
  );
  const contextual = ARTIST_SOURCE_CATALOG.map((source, index) => ({
    source,
    index,
    score: source.tags.reduce((total, tag) => total + (contextTags.has(tag) ? 1 : 0), 0),
  })).sort((a, b) => b.score - a.score || a.index - b.index);

  if (contextual[0]?.score > 0) return contextual[0].source;

  // Broad questions still get an artist witness, but do not pretend a precise match exists.
  // Rotate deterministically so generic prompts do not always receive the same witness.
  return ARTIST_SOURCE_CATALOG[stableIndex(normalized, ARTIST_SOURCE_CATALOG.length)];
}

export function ensureArtistWitness(sources: PublicSource[], text: string, max = 9): PublicSource[] {
  if (sources.some((source) => ARTIST_WITNESS_IDS.has(source.id))) return sources.slice(0, max);

  const witness = selectArtistWitness(text, sources);
  const moderatorIds = new Set(["S28", "S29"]);
  const moderators = sources.filter((source) => moderatorIds.has(source.id));
  const topical = sources.filter((source) => !moderatorIds.has(source.id));
  const availableTopicalSlots = Math.max(0, max - moderators.length - 1);

  return [...topical.slice(0, availableTopicalSlots), witness, ...moderators].slice(0, max);
}
