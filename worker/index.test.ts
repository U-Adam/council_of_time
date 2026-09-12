import { describe, expect, it } from "vitest";
import {
  continuationInstruction,
  extractPause,
  generationOptions,
  invalidCitationIds,
  parseModelText,
} from "./index";
import { selectSources } from "./sources";

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

describe("topic-aware source selection", () => {
  it("routes relationship contempt toward relationship-relevant voices", () => {
    const ids = selectSources("Can love survive chronic contempt in a marriage?").map((source) => source.id);

    expect(ids.slice(0, 5)).toEqual(expect.arrayContaining(["S13", "S12", "S10", "S14"]));
    expect(ids.indexOf("S13")).toBeLessThan(ids.indexOf("S6"));
  });

  it("prioritizes an explicitly named thinker", () => {
    const ids = selectSources("What would Kant say about a broken promise?").map((source) => source.id);

    expect(ids.slice(0, 2)).toEqual(["S5", "S6"]);
  });
});
