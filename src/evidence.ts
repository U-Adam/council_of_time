export type ClaimAttribution = "Direct" | "Derived" | "Speculative";

export type ParsedClaimEvidence = {
  claim: string;
  attribution: ClaimAttribution;
};

export const CITATION_MARKER = "§CITATION§";

function attributionFrom(context: string): ClaimAttribution {
  if (/\{\{Speculative\}\}/.test(context)) return "Speculative";
  if (/\{\{Derived\}\}/.test(context)) return "Derived";
  return "Direct";
}

function sentenceAroundCitation(context: string) {
  const citationOffset = context.indexOf(CITATION_MARKER);
  if (citationOffset === -1) return context;

  let start = 0;
  const before = context.slice(0, citationOffset);
  for (const match of before.matchAll(/[.!?](?:\s+|$)/g)) {
    start = (match.index || 0) + match[0].length;
  }

  let end = context.length;
  const after = context.slice(citationOffset + CITATION_MARKER.length);
  const nextBoundary = after.match(/[.!?](?=\s|$)/);
  if (nextBoundary?.index !== undefined) {
    end = citationOffset + CITATION_MARKER.length + nextBoundary.index + 1;
  }

  const candidate = context.slice(start, end).trim();
  const withoutMarker = candidate.replace(CITATION_MARKER, "").replace(/\{\{(?:Derived|Speculative)\}\}/g, "").trim();
  return withoutMarker.length >= 12 ? candidate : context;
}

function cleanClaim(context: string) {
  return context
    .replace(CITATION_MARKER, "")
    .replace(/\{\{(?:Derived|Speculative)\}\}/g, "")
    .replace(/Artist Witness/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

export function parseClaimEvidence(serializedContext: string): ParsedClaimEvidence {
  const focused = sentenceAroundCitation(serializedContext);
  return {
    claim: cleanClaim(focused) || "This claim is linked to the cited source.",
    attribution: attributionFrom(focused),
  };
}
