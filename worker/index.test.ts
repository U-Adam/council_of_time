import { describe, expect, it } from "vitest";
import {
  continuationInstruction,
  extractPause,
  generationOptions,
  invalidCitationIds,
  parseModelText,
} from "./index";
import { selectSources, SOURCE_CATALOG } from "./sources";

describe("Workers AI response parsing", () => {
  it("extracts visible chat-completion content", () => {
    const result = {
      choices: [
        {
          finish_reason: "stop",
          message: { role: "assistant", content: "A visible answer.", reasoning: null },
        },
      ],
    };

    expect(parseModelText(result)).toBe("A visible answer.");
  });

  it("does not mistake hidden reasoning for a visible answer", () => {
    const result = {
      choices: [
        {
          finish_reason: "length",
          message: { role: "assistant", content: null, reasoning: "Hidden chain of thought" },
        },
      ],
    };

    expect(parseModelText(result)).toBe("");
  });
});

describe("fault-line state", () => {
  it("extracts the machine-readable pause question from the end of an answer", () => {
    const parsed = extractPause(
      "### Deliberation\nThe distinction matters.\nPAUSE_QUESTION: Is the contempt episodic or a settled judgment of the person's character?",
    );

    expect(parsed.answer).toContain("The distinction matters.");
    expect(parsed.answer).not.toContain("PAUSE_QUESTION");
    expect(parsed.pause?.question).toBe(
      "Is the contempt episodic or a settled judgment of the person's character?",
    );
  });

  it("marks a resumed turn with the exact prior question", () => {
    const prior = "Is the contempt episodic or chronic?";
    const instruction = continuationInstruction("resume", prior);

    expect(instruction).toContain(prior);
    expect(instruction).toContain("Resume the existing deliberation");
  });
});

describe("model generation options", () => {
  it("disables thinking for reasoning-capable Council models", () => {
    expect(generationOptions("@cf/google/gemma-4-26b-a4b-it", 1800, 0.35)).toMatchObject({
      max_completion_tokens: 1800,
      chat_template_kwargs: { enable_thinking: false },
    });
  });

  it("uses the legacy token parameter for the emergency Llama fallback", () => {
    expect(generationOptions("@cf/meta/llama-3.1-8b-instruct-fast", 1800, 0.35)).toEqual({
      max_tokens: 1800,
      temperature: 0.35,
    });
  });
});

describe("citation integrity", () => {
  it("flags citations outside the allowed source set", () => {
    const invalid = invalidCitationIds(
      "Kant matters here [S6], but this invented source does not [S99].",
      new Set(["S6", "S13"]),
    );

    expect(invalid).toEqual(["S99"]);
  });

  it("accepts repeated citations from the allowed source set", () => {
    expect(invalidCitationIds("Claim [S6]. Another claim [S6] [S13].", new Set(["S6", "S13"]))).toEqual([]);
  });
});

describe("public source registry", () => {
  it("has unique IDs, valid public URLs, tags, and source guardrails", () => {
    const ids = SOURCE_CATALOG.map((source) => source.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const source of SOURCE_CATALOG) {
      expect(source.url.startsWith("https://")).toBe(true);
      expect(source.tags.length).toBeGreaterThan(0);
      expect(source.note.trim().length).toBeGreaterThan(40);
    }
  });

  it("covers every permanent philosophical member plus Bourdain as moderator", () => {
    const requiredAnchors = [
      "plato",
      "confucius",
      "nagarjuna",
      "thomas aquinas",
      "maimonides",
      "ibn rushd",
      "kant",
      "kierkegaard",
      "john stuart mill",
      "du bois",
      "hannah arendt",
      "simone de beauvoir",
      "camus",
      "frantz fanon",
      "james baldwin",
      "audre lorde",
      "michel foucault",
      "alan watts",
      "angela davis",
      "bell hooks",
      "judith butler",
      "cornel west",
      "martha nussbaum",
      "anthony bourdain",
    ];
    const anchors = new Set(SOURCE_CATALOG.flatMap((source) => source.anchors || []).map((anchor) => anchor.toLowerCase()));

    for (const required of requiredAnchors) {
      expect(anchors.has(required), `Missing public source coverage for ${required}`).toBe(true);
    }
  });
});

describe("topic-aware source selection", () => {
  it("routes relationship contempt toward relationship-relevant voices", () => {
    const ids = selectSources("Can love survive chronic contempt in a marriage?").map((source) => source.id);

    expect(ids.slice(0, 4)).toEqual(["S13", "S12", "S10", "S14"]);
    expect(ids).toContain("S28");
    expect(ids).toContain("S29");
  });

  it("prioritizes an explicitly named thinker", () => {
    const ids = selectSources("What would Kant say about a broken promise?").map((source) => source.id);

    expect(ids.slice(0, 2)).toEqual(["S5", "S6"]);
  });

  it("routes prison abolition directly to Angela Davis", () => {
    const ids = selectSources("What does prison abolition demand of justice?").map((source) => source.id);

    expect(ids[0]).toBe("S25");
  });

  it("routes reason and revelation toward the medieval comparative table", () => {
    const ids = selectSources("How should reason and revelation relate in law?").map((source) => source.id);
    const topThree = new Set(ids.slice(0, 3));

    expect(topThree).toEqual(new Set(["S19", "S20", "S21"]));
  });
});
