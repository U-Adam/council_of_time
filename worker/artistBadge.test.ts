import { describe, expect, it } from "vitest";
import { ensureArtistWitnessBadge } from "./index";
import { ARTIST_SOURCE_CATALOG } from "./artistSources";

describe("Artist Witness rendering integrity", () => {
  const dylan = ARTIST_SOURCE_CATALOG.find((source) => source.id === "S30")!;

  it("adds the badge token to an artist table row when the model omits it", () => {
    const answer = [
      "### Table",
      "| Voice | Core perspective | Application to this question |",
      "| --- | --- | --- |",
      "| Bob Dylan | American myth and history [S30] | Complicates heroic memory. {{Derived}} |",
    ].join("\n");

    expect(ensureArtistWitnessBadge(answer, [dylan])).toContain("Bob Dylan `Artist Witness`");
  });

  it("preserves an existing badge token without duplication", () => {
    const answer = "| Bob Dylan `Artist Witness` | American myth [S30] | Tests heroic memory. |";

    expect(ensureArtistWitnessBadge(answer, [dylan])).toBe(answer);
  });

  it("keeps a bold artist name valid while placing the badge after the name", () => {
    const answer = "| **Bob Dylan** | American myth [S30] | Tests heroic memory. |";

    expect(ensureArtistWitnessBadge(answer, [dylan])).toContain("**Bob Dylan** `Artist Witness`");
  });
});
