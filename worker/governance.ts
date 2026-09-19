import {
  CANONICAL_ARTIST_WITNESSES,
  CANONICAL_MODERATOR,
  CANONICAL_THINKERS,
} from "./canonicalRoster";

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

const PERMANENT_THINKERS = new Set(CANONICAL_THINKERS.map(normalizeName));
const PERMANENT_WITNESSES = new Set(CANONICAL_ARTIST_WITNESSES.map(normalizeName));
const MODERATORS = new Set([normalizeName(CANONICAL_MODERATOR)]);
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
  const approved = approvedGuests.filter((name) => APPROVED_GUEST_NAMES.has(normalizeName(name)));
  const requested = [...plannedVoices, artistWitness || "", CANONICAL_MODERATOR, ...approved].filter(Boolean);

  return new Set(
    requested
      .filter((name) => {
        const status = participantStatus(name);
        return status === "permanent_thinker" || status === "permanent_witness" || status === "moderator" || status === "approved_guest";
      })
      .map(normalizeName),
  );
}

function cellsForRow(line: string) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) return [];
  return trimmed
    .split("|")
    .slice(1, trimmed.endsWith("|") ? -1 : undefined)
    .map((cell) => cell.trim());
}

function isSeparatorRow(cells: string[]) {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function cleanParticipantCell(value: string) {
  return value
    .replace(/`Artist Witness`/gi, "")
    .replace(/\[(?:S\d+|Guest[^\]]*)\]/gi, "")
    .replace(/[\*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function tableParticipantNames(answer: string): string[] {
  const lines = answer.split("\n");
  const names: string[] = [];

  // Validate the actual GFM table signature rather than trusting the model to preserve
  // a specific heading. This prevents a rogue seat from bypassing validation merely by
  // omitting or renaming "## Table" while still rendering a participant table.
  for (let index = 0; index < lines.length - 1; index += 1) {
    const header = cellsForRow(lines[index]);
    if (header.length < 3 || !/^voice$/i.test(cleanParticipantCell(header[0]))) continue;

    const separator = cellsForRow(lines[index + 1]);
    if (!isSeparatorRow(separator)) continue;

    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex += 1) {
      const row = cellsForRow(lines[rowIndex]);
      if (row.length < 3 || isSeparatorRow(row)) break;
      const cleaned = cleanParticipantCell(row[0]);
      if (cleaned) names.push(cleaned);
    }

    break;
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
  return [
    ...CANONICAL_THINKERS,
    ...CANONICAL_ARTIST_WITNESSES,
    CANONICAL_MODERATOR,
  ];
}
