import { describe, expect, it } from "vitest";
import {
  CANONICAL_ARTIST_WITNESSES,
  CANONICAL_MODERATOR,
  CANONICAL_THINKERS,
} from "./canonicalRoster";
import { ALL_SOURCE_CATALOG_V2 } from "./selection";
import { SOURCE_META, sourceMeta } from "./sourceMeta";

function unique(values: readonly string[]) {
  return new Set(values);
}

describe("canonical roster synchronization", () => {
  it("prevents runtime thinker metadata from creating shadow permanent members", () => {
    const canonical = unique(CANONICAL_THINKERS);
    const runtime = unique(
      Object.values(SOURCE_META)
        .filter((meta) => meta.role === "thinker")
        .map((meta) => meta.voice),
    );

    expect(runtime).toEqual(canonical);
  });

  it("prevents runtime artist metadata from creating shadow permanent witnesses", () => {
    const canonical = unique(CANONICAL_ARTIST_WITNESSES);
    const runtime = unique(
      Object.values(SOURCE_META)
        .filter((meta) => meta.role === "artist")
        .map((meta) => meta.voice),
    );

    expect(runtime).toEqual(canonical);
  });

  it("has authoritative source coverage for every canonical permanent participant", () => {
    const thinkerVoices = new Set<string>();
    const artistVoices = new Set<string>();
    const moderatorVoices = new Set<string>();

    for (const source of ALL_SOURCE_CATALOG_V2) {
      const meta = sourceMeta(source.id);
      if (!meta) continue;
      if (meta.role === "thinker") thinkerVoices.add(meta.voice);
      if (meta.role === "artist") artistVoices.add(meta.voice);
      if (meta.role === "moderator") moderatorVoices.add(meta.voice);
    }

    for (const voice of CANONICAL_THINKERS) {
      expect(thinkerVoices.has(voice), `Missing thinker source coverage for ${voice}`).toBe(true);
    }
    for (const voice of CANONICAL_ARTIST_WITNESSES) {
      expect(artistVoices.has(voice), `Missing artist source coverage for ${voice}`).toBe(true);
    }
    expect(moderatorVoices.has(CANONICAL_MODERATOR)).toBe(true);
  });

  it("keeps case subjects outside permanent membership", () => {
    const permanent = new Set<string>([
      ...CANONICAL_THINKERS,
      ...CANONICAL_ARTIST_WITNESSES,
      CANONICAL_MODERATOR,
    ]);

    const caseVoices = Object.values(SOURCE_META)
      .filter((meta) => meta.role === "case")
      .map((meta) => meta.voice);

    for (const voice of caseVoices) {
      expect(permanent.has(voice), `Case subject ${voice} must not become a permanent member`).toBe(false);
    }
  });
});
