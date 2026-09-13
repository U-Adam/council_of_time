import { describe, expect, it } from "vitest";
import { recentSourceIds } from "./index";
import {
  ALL_SOURCE_CATALOG_V2,
  ARTIST_SOURCE_CATALOG_V2,
  selectArtistWitnessV2,
  selectSourcesV2,
} from "./selection";
import { sourceMeta, voiceForSource } from "./sourceMeta";
import { createTablePlan } from "./tablePlan";

describe("full-roster Council selection", () => {
  it("keeps every runtime source ID unique and mapped to a role", () => {
    const ids = ALL_SOURCE_CATALOG_V2.map((source) => source.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const source of ALL_SOURCE_CATALOG_V2) {
      expect(sourceMeta(source.id), `Missing source metadata for ${source.id}`).toBeTruthy();
    }
  });

  it("makes the later-added permanent thinkers selectable", () => {
    const required = [
      "Laozi",
      "V. F. Cordova",
      "Vine Deloria Jr.",
      "Kyle Powys Whyte",
      "Mary Graham",
      "Aileen Moreton-Robinson",
      "Tyson Yunkaporta",
      "Viktor E. Frankl",
      "Albert Einstein",
      "Stephen Hawking",
      "Carl Sagan",
      "J. Robert Oppenheimer",
      "Baruch Spinoza",
      "Friedrich Nietzsche",
      "John Rawls",
      "Karl Marx",
      "Adam Smith",
      "Sigmund Freud",
      "Charles Darwin",
      "William James",
      "George Orwell",
      "Toni Morrison",
      "Martin Luther King Jr.",
      "Carl G. Jung",
      "Richard Feynman",
      "Jane Goodall",
    ];
    const availableVoices = new Set(
      ALL_SOURCE_CATALOG_V2.map((source) => voiceForSource(source.id)).filter(Boolean),
    );

    for (const voice of required) {
      expect(availableVoices.has(voice), `Missing permanent thinker ${voice}`).toBe(true);
    }
  });

  it("expands the Artist Witness registry beyond the original eight", () => {
    const required = [
      "Bob Dylan",
      "David Byrne",
      "Octavia E. Butler",
      "Leonard Cohen",
      "Frida Kahlo",
      "Jean-Michel Basquiat",
      "John Lennon",
      "Yoko Ono",
      "George Carlin",
      "Charles Bukowski",
      "Ursula K. Le Guin",
      "Dolly Parton",
      "Christopher Nolan",
      "Steven Spielberg",
      "Salvador Dalí",
      "Sam Shepard",
      "Toni Morrison",
      "John Steinbeck",
      "David Bowie",
    ];
    const artistVoices = new Set(ARTIST_SOURCE_CATALOG_V2.map((source) => voiceForSource(source.id)));

    expect(ARTIST_SOURCE_CATALOG_V2.length).toBe(19);
    for (const voice of required) {
      expect(artistVoices.has(voice), `Missing Artist Witness ${voice}`).toBe(true);
    }
  });

  it("can convene a newly added permanent thinker instead of silently falling back to the old roster", () => {
    const plan = createTablePlan(
      "How does Mary Graham's idea of Country change what custodial obligation means?",
    );

    expect(plan.voices).toContain("Mary Graham");
    expect(plan.sourceIds).toContain("S44");
  });

  it("routes labor, alienation, and capital to Marx when those concepts are central", () => {
    const voices = selectSourcesV2(
      "How should we judge alienation and exploitation when wage labor serves capital?",
    ).map((source) => voiceForSource(source.id));

    expect(voices).toContain("Karl Marx");
  });

  it("routes climate responsibility toward Indigenous environmental philosophy", () => {
    const voices = selectSourcesV2(
      "What do we owe future generations when climate policy collides with settler colonialism and Indigenous sovereignty?",
    ).map((source) => voiceForSource(source.id));

    expect(voices).toContain("Kyle Powys Whyte");
  });
});

describe("anti-redundancy guardrails", () => {
  it("tracks recent participation once per assistant turn rather than once per repeated citation", () => {
    const ids = recentSourceIds([
      { role: "assistant", content: "Kant [S6] appears twice [S6]." },
      { role: "user", content: "Next question." },
      { role: "assistant", content: "Kant again [S6], with Arendt [S9]." },
      { role: "user", content: "Another question." },
    ]);

    expect(ids).toEqual(["S6", "S6", "S9"]);
  });

  it("uses recent repetition only to break broad relevance ties among artists", () => {
    const question = "What can an artist show us about an ordinary human problem?";
    const first = selectArtistWitnessV2(question);
    const second = selectArtistWitnessV2(question, [], [first.id]);

    expect(second.id).not.toBe(first.id);
  });

  it("does not rotate away an explicitly requested thinker merely for novelty", () => {
    const sources = selectSourcesV2(
      "What would Kant say about a promise I am tempted to break?",
      9,
      ["S5", "S6", "S5", "S6"],
    );

    expect(sources.some((source) => source.id === "S5" || source.id === "S6")).toBe(true);
  });

  it("does not rotate away an explicitly requested artist merely for novelty", () => {
    const source = selectArtistWitnessV2(
      "What does Leonard Cohen illuminate about grief and faith?",
      [],
      ["S33", "S33", "S33"],
    );

    expect(source.id).toBe("S33");
  });
});
