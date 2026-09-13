import type { PublicSource } from "./sources";
import {
  ARTIST_WITNESS_IDS_V2,
  selectArtistWitnessV2,
} from "./selection";
import { sourceMeta } from "./sourceMeta";

export const ARTIST_WITNESS_IDS = ARTIST_WITNESS_IDS_V2;

export function selectArtistWitness(
  text: string,
  contextSources: PublicSource[] = [],
  recentSourceIds: string[] = [],
): PublicSource {
  return selectArtistWitnessV2(text, contextSources, recentSourceIds);
}

export function ensureArtistWitness(
  sources: PublicSource[],
  text: string,
  max = 9,
  recentSourceIds: string[] = [],
): PublicSource[] {
  if (sources.some((source) => ARTIST_WITNESS_IDS.has(source.id))) return sources.slice(0, max);

  const witness = selectArtistWitness(text, sources, recentSourceIds);
  const moderatorIds = new Set(["S28", "S29"]);
  const moderators = sources.filter((source) => moderatorIds.has(source.id));
  const cases = sources.filter((source) => sourceMeta(source.id)?.role === "case");
  const topical = sources.filter(
    (source) => !moderatorIds.has(source.id) && sourceMeta(source.id)?.role !== "case",
  );
  const availableTopicalSlots = Math.max(0, max - moderators.length - cases.length - 1);

  return [
    ...topical.slice(0, availableTopicalSlots),
    ...cases,
    witness,
    ...moderators,
  ].slice(0, max);
}
