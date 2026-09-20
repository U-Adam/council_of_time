import { describe, expect, it } from "vitest";
import { prepareEvidenceMarkdown } from "./evidence";

const valid = new Set(["S5", "S9"]);

describe("claim evidence preparation", () => {
  it("treats a cited unmarked claim as Direct", () => {
    const result = prepareEvidenceMarkdown("Kant grounds dignity in rational agency [S5].", valid);
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0]).toMatchObject({ sourceId: "S5", attribution: "Direct" });
    expect(result.evidence[0].claim).toBe("Kant grounds dignity in rational agency.");
    expect(result.markdown).toContain("[5](#claim-evidence-0)");
  });

  it("carries Derived provenance into the evidence record", () => {
    const result = prepareEvidenceMarkdown(
      "A Kantian reading would treat this promise as a test of respect [S5] {{Derived}}.",
      valid,
    );
    expect(result.evidence[0].attribution).toBe("Derived");
    expect(result.markdown).toContain("`Derived`");
  });

  it("uses the cited table cell rather than a different cell's attribution marker", () => {
    const result = prepareEvidenceMarkdown(
      "| Voice | Core perspective | Application |\n| --- | --- | --- |\n| Kant | Dignity and duty [S5] | This tests the promise {{Derived}} |",
      valid,
    );
    expect(result.evidence[0].claim).toBe("Dignity and duty");
    expect(result.evidence[0].attribution).toBe("Direct");
  });

  it("does not convert source IDs that were not supplied by the API", () => {
    const result = prepareEvidenceMarkdown("Supported [S5]. Unknown [S404].", valid);
    expect(result.evidence).toHaveLength(1);
    expect(result.markdown).toContain("[S404]");
  });
});
