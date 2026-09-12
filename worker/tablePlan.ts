import { selectSources } from "./sources";

const VOICE_BY_SOURCE_ID: Record<string, string> = {
  S1: "Plato",
  S2: "Plato",
  S3: "Confucius",
  S4: "Confucius",
  S5: "Immanuel Kant",
  S6: "Immanuel Kant",
  S7: "John Stuart Mill",
  S8: "John Stuart Mill",
  S9: "Hannah Arendt",
  S10: "Simone de Beauvoir",
  S11: "Albert Camus",
  S12: "Søren Kierkegaard",
  S13: "bell hooks",
  S14: "James Baldwin",
  S15: "Michel Foucault",
  S16: "Frantz Fanon",
  S17: "Martha Nussbaum",
  S18: "Nāgārjuna",
  S19: "Thomas Aquinas",
  S20: "Maimonides",
  S21: "Ibn Rushd",
  S22: "W.E.B. Du Bois",
  S23: "Audre Lorde",
  S24: "Alan Watts",
  S25: "Angela Davis",
  S26: "Judith Butler",
  S27: "Cornel West",
  S28: "Anthony Bourdain",
  S29: "Anthony Bourdain",
};

export function createTablePlan(text: string, maxVoices = 4) {
  const sources = selectSources(text);
  const voices: string[] = [];
  const seen = new Set<string>();

  for (const source of sources) {
    const voice = VOICE_BY_SOURCE_ID[source.id];
    if (!voice || voice === "Anthony Bourdain" || seen.has(voice)) continue;
    seen.add(voice);
    voices.push(voice);
    if (voices.length >= maxVoices) break;
  }

  return {
    voices,
    moderator: "Anthony Bourdain",
    sourceIds: sources.map((source) => source.id),
  };
}
