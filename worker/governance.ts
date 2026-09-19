import { SOURCE_META } from "./sourceMeta";

export type ParticipantStatus =
  | "permanent_thinker"
  | "permanent_witness"
  | "moderator"
  | "approved_guest"
  | "historical_source_only"
  | "unregistered";

export type ApprovedGuest = {
  id: string;
  name: string;
  role: "guest_thinker" | "expert" | "artist_witness" | "historical_witness";
  sourceIds: string[];
  reason: string;
};

export type HistoricalSourceOnly = {
  name: string;
  reason: string;
};

// Guests require an explicit registry entry before they can ever become a Table participant.
// Keep this list empty unless a guest has been intentionally approved under the Constitution.
export const APPROVED_GUESTS: ApprovedGuest[] = [];

// Historical Source Only figures may be researched and analyzed, but never seated.
// The default-deny rule for all unregistered outsiders means this list does not need to be exhaustive.
export const HISTORICAL_SOURCE_ONLY: HistoricalSourceOnly[] = [
  {
    name: "Adolf Hitler",
    reason:
      "Central political project included racial supremacy, systematic dehumanization, aggressive war, and genocide. Researchable as a historical and ideological source; never eligible for deliberative standing.",
  },
];

function normalizeName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/`Artist Witness`/gi, "")
    .replace(/\[(?:S\d+|Guest[^\]]*)\]/gi, "")
    .replace(/[\*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const PERMANENT_THINKERS = new Set(
  Object.values(SOURCE_META)
    .filter((meta) => meta.role === "thinker")
    .map((meta) => normalizeName(meta.voice)),
);

const PERMANENT_WITNESSES = new Set(
  Object.values(SOURCE_META)
    .filter((meta) => meta.role === "artist")
    .map((meta) => normalizeName(meta.voice)),
);

const MODERATORS = new Set(
  Object.values(SOURCE_META)
    .filter((meta) => meta.role === "moderator")
    .map((meta) => normalizeName(meta.voice)),
);

const APPROVED_GUEST_NAMES = new Set(APPROVED_GUESTS.map((guest) => normalizeName(guest.name)));
const HISTORICAL_ONLY_NAMES = new Set(HISTORICAL_SOURCE_ONLY.map((entry) => normalizeName(entry.name)));

export function participantStatus(name: string): ParticipantStatus {
  const normalized = normalizeName(name);
  if (PERMANENT_THINKERS.has(normalized)) return "permanent_thinker";
  if (PERMANENT_WITNESSES.has(normalized)) return "permanent_witness";
  if (MODERATORS.has(normalized)) return "moderator";
  if (APPROVED_GUEST_NAMES.has(normalized)) return "approved_guest";
  if (HISTORICAL_ONLY_NAMES.has(normalized)) return "historical_source_only";
  return "unregistered";
}

export function authorizedParticipantSet(
  plannedVoices: string[] = [],
  artistWitness: string | null = null,
  approvedGuests: string[] = [],
) {
  return new Set(
    [
      ...plannedVoices,
      artistWitness || "",
      "Anthony Bourdain",
      ...approvedGuests.filter((name) => APPROVED_GUEST_NAMES.has(normalizeName(name))),
    ]
      .filter(Boolean)
      .map(normalizeName),
  );
}

function isSeparatorRow(cells: string[]) {
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

export function tableParticipantNames(answer: string): string[] {
  const lines = answer.split("\n");
  const headingIndex = lines.findIndex((line) => /^#{1,6}\s+(?:the\s+)?table\s*$/i.test(line.trim()));
  if (headingIndex === -1) return [];

  const names: string[] = [];
  let sawTable = false;

  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (/^#{1,6}\s+/.test(line)) break;
    if (!line.startsWith("|")) {
      if (sawTable && line) break;
      continue;
    }

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 3) continue;
    sawTable = true;

    if (/^voice$/i.test(cells[0]) || isSeparatorRow(cells)) continue;
    const cleaned = cells[0]
      .replace(/`Artist Witness`/gi, "")
      .replace(/\[(?:S\d+|Guest[^\]]*)\]/gi, "")
      .replace(/[\*_`~]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned) names.push(cleaned);
  }

  return names;
}

export function unauthorizedTableParticipants(answer: string, allowedParticipants: Set<string>) {
  const invalid: string[] = [];

  for (const name of tableParticipantNames(answer)) {
    if (!allowedParticipants.has(normalizeName(name))) invalid.push(name);
  }

  return [...new Set(invalid)];
}

export function historicalSourceOnlyNames() {
  return HISTORICAL_SOURCE_ONLY.map((entry) => entry.name);
}

export function permanentParticipantNames() {
  return [...new Set(
    Object.values(SOURCE_META)
      .filter((meta) => meta.role === "thinker" || meta.role === "artist" || meta.role === "moderator")
      .map((meta) => meta.voice),
  )];
}
