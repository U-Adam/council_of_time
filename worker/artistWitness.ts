import type { PublicSource } from "./sources";
import {
  ARTIST_WITNESS_IDS_V2,
  selectArtistWitnessV2,
} from "./selection";

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
  const nonModerators = sources.filter((source) => !moderatorIds.has(source.id));
  const availableNonModeratorSlots = Math.max(0, max - moderators.length - 1);

  return [
    ...nonModerators.slice(0, availableNonModeratorSlots),
    witness,
    ...moderators,
  ].slice(0, max);
}
