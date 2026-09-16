import type { PublicSource } from "./sources";
import {
  ARTIST_SOURCE_CATALOG_V2,
  ARTIST_WITNESS_IDS_V2,
  selectArtistWitnessV2,
} from "./selection";

export const ARTIST_WITNESS_IDS = ARTIST_WITNESS_IDS_V2;

const WITNESS_SIGNAL_TERMS = [
  "art", "artist", "music", "song", "album", "film", "movie", "cinema", "novel", "fiction", "poem", "poetry",
  "painting", "photography", "culture", "performance", "fame", "celebrity", "beauty", "myth", "memory", "grief",
  "mortality", "loneliness", "embodiment", "body", "pain", "masculinity", "self-invention", "reinvention", "addiction",
  "spectacle", "identity", "alienation", "creative", "story", "storytelling",
];

function normalize(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function phrasePresent(text: string, phrase: string) {
  const normalizedText = normalize(text);
  const normalizedPhrase = normalize(phrase).trim();
  if (!normalizedPhrase) return false;
  const escaped = normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(normalizedText);
}

export function selectArtistWitness(
  text: string,
  contextSources: PublicSource[] = [],
  recentSourceIds: string[] = [],
): PublicSource {
  return selectArtistWitnessV2(text, contextSources, recentSourceIds);
}

export function shouldIncludeArtistWitness(text: string) {
  const explicitlyNamed = ARTIST_SOURCE_CATALOG_V2.some((source) =>
    (source.anchors || []).some((anchor) => phrasePresent(text, anchor)),
  );
  return explicitlyNamed || WITNESS_SIGNAL_TERMS.some((term) => phrasePresent(text, term));
}

export function ensureArtistWitness(
  sources: PublicSource[],
  text: string,
  max = 9,
  recentSourceIds: string[] = [],
): PublicSource[] {
  if (sources.some((source) => ARTIST_WITNESS_IDS.has(source.id))) return sources.slice(0, max);
  if (!shouldIncludeArtistWitness(text)) return sources.slice(0, max);

  const witness = selectArtistWitness(text, sources, recentSourceIds);
  const moderatorIds = new Set(["S28", "S29"]);
  const moderators = sources.filter((source) => moderatorIds.has(source.id));
  const cases = sources.filter((source) => source.id === "S38" || source.id === "S39");
  const topical = sources.filter(
    (source) => !moderatorIds.has(source.id) && source.id !== "S38" && source.id !== "S39",
  );
  const availableTopicalSlots = Math.max(0, max - moderators.length - cases.length - 1);

  return [
    ...topical.slice(0, availableTopicalSlots),
    ...cases,
    witness,
    ...moderators,
  ].slice(0, max);
}
