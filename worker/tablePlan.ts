import { ARTIST_WITNESS_IDS, ensureArtistWitness } from "./artistWitness";
import { selectSourcesV2 } from "./selection";
import { sourceMeta, voiceForSource } from "./sourceMeta";

export function createTablePlan(
  text: string,
  maxVoices = 5,
  recentSourceIds: string[] = [],
) {
  const sources = ensureArtistWitness(
    selectSourcesV2(text, 9, recentSourceIds),
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
    sourceIds: sources.map((source) => source.id),
  };
}
