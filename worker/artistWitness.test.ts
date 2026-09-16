import { describe, expect, it } from "vitest";
import { ensureArtistWitness, shouldIncludeArtistWitness } from "./artistWitness";
import { selectSourcesV2 } from "./selection";

function hasArtist(sources: ReturnType<typeof selectSourcesV2>) {
  return sources.some((source) => /^S(?:30|31|32|33|34|35|36|37|66|67|68|69|70|71|72|73|74|75|76|77|78)$/.test(source.id));
}

describe("relevance-driven Artist Witness selection", () => {
  it("does not force an artist into a purely procedural moral question", () => {
    const question = "Is it fair to split a shared bill evenly when one person ordered much more?";
    expect(shouldIncludeArtistWitness(question)).toBe(false);
    const selected = selectSourcesV2(question, 9);
    const routed = ensureArtistWitness(selected.filter((source) => !hasArtist([source])), question, 9);
    expect(hasArtist(routed)).toBe(false);
  });

  it("allows an artist when art or lived cultural witness materially fits", () => {
    const question = "What does Jordan Peele's horror say about spectatorship and race?";
    expect(shouldIncludeArtistWitness(question)).toBe(true);
    expect(hasArtist(ensureArtistWitness(selectSourcesV2(question, 9), question, 9))).toBe(true);
  });
});
