import { describe, expect, it } from "vitest";
import { CITATION_MARKER, parseClaimEvidence } from "./evidence";

describe("claim evidence parsing", () => {
  it("treats an unmarked cited claim as Direct", () => {
    const result = parseClaimEvidence(`Kant grounds dignity in rational agency ${CITATION_MARKER}.`);
    expect(result).toEqual({
      claim: "Kant grounds dignity in rational agency.",
      attribution: "Direct",
    });
  });

  it("carries Derived provenance into the evidence record", () => {
    const result = parseClaimEvidence(
      `A Kantian reading would treat this promise as a test of respect ${CITATION_MARKER} {{Derived}}.`,
    );
    expect(result.attribution).toBe("Derived");
    expect(result.claim).toBe("A Kantian reading would treat this promise as a test of respect.");
  });

  it("carries Speculative provenance into the evidence record", () => {
    const result = parseClaimEvidence(
      `This modern extension goes beyond the historical source ${CITATION_MARKER} {{Speculative}}.`,
    );
    expect(result.attribution).toBe("Speculative");
  });

  it("focuses on the sentence containing the citation", () => {
    const result = parseClaimEvidence(
      `First sentence. The supported claim is here ${CITATION_MARKER}. A later sentence is separate.`,
    );
    expect(result.claim).toBe("The supported claim is here.");
  });
});
