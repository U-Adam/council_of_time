import { describe, expect, it } from "vitest";
import {
  APPROVED_GUESTS,
  HISTORICAL_SOURCE_ONLY,
  authorizedParticipantSet,
  participantStatus,
  permanentParticipantNames,
  tableParticipantNames,
  unauthorizedTableParticipants,
} from "./governance";

describe("Council participant governance", () => {
  it("treats permanent roster voices as selectable and case subjects as nonmembers", () => {
    expect(participantStatus("Immanuel Kant")).toBe("permanent_thinker");
    expect(participantStatus("David Byrne")).toBe("permanent_witness");
    expect(participantStatus("Anthony Bourdain")).toBe("moderator");
    expect(participantStatus("Winston Churchill")).toBe("unregistered");
  });

  it("classifies Historical Source Only figures as researchable but non-seatable", () => {
    expect(HISTORICAL_SOURCE_ONLY.some((entry) => entry.name === "Adolf Hitler")).toBe(true);
    expect(participantStatus("Adolf Hitler")).toBe("historical_source_only");
    expect(permanentParticipantNames()).not.toContain("Adolf Hitler");
  });

  it("defaults unknown outsiders to non-seatable rather than silently treating them as guests", () => {
    expect(APPROVED_GUESTS).toEqual([]);
    expect(participantStatus("A completely unregistered thinker")).toBe("unregistered");
  });

  it("extracts participant names only from the visible Table", () => {
    const answer = `## The Table
| Voice | Core perspective | Application to this question |
| --- | --- | --- |
| **Immanuel Kant** | Duty [S6] | Tests the rule. |
| David Byrne \`Artist Witness\` | Systems [S31] | Tests the design. |

## Deliberation
Adolf Hitler is mentioned here only as a historical subject.`;

    expect(tableParticipantNames(answer)).toEqual(["Immanuel Kant", "David Byrne"]);
  });

  it("rejects a rogue thinker seated in the Table even when the name is real", () => {
    const allowed = authorizedParticipantSet(["Immanuel Kant", "Hannah Arendt"], "David Byrne");
    const answer = `## Table
| Voice | Core perspective | Application to this question |
| --- | --- | --- |
| Immanuel Kant | Duty [S6] | Tests duty. |
| Hannah Arendt | Judgment [S9] | Tests responsibility. |
| David Byrne \`Artist Witness\` | Systems [S31] | Tests structure. |
| Adolf Hitler | Ideology | Should never be seated. |`;

    expect(unauthorizedTableParticipants(answer, allowed)).toEqual(["Adolf Hitler"]);
  });

  it("rejects an ordinary unregistered outsider from the Table", () => {
    const allowed = authorizedParticipantSet(["John Stuart Mill"], null);
    const answer = `## The Table
| Voice | Core perspective | Application to this question |
| --- | --- | --- |
| John Stuart Mill | Liberty [S7] | Tests harm. |
| Oprah Winfrey | Public influence | Unauthorized outsider. |`;

    expect(unauthorizedTableParticipants(answer, allowed)).toEqual(["Oprah Winfrey"]);
  });

  it("does not confuse discussion of an outsider with deliberative standing", () => {
    const allowed = authorizedParticipantSet(["Hannah Arendt"], null);
    const answer = `## Table
| Voice | Core perspective | Application to this question |
| --- | --- | --- |
| Hannah Arendt | Judgment [S9] | Tests responsibility. |

## Deliberation
The Council may analyze Hitler as a historical actor without giving him a seat.`;

    expect(unauthorizedTableParticipants(answer, allowed)).toEqual([]);
  });
});
