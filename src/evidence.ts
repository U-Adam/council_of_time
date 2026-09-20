export type ClaimAttribution = "Direct" | "Derived" | "Speculative";

export type ClaimEvidence = {
  href: string;
  sourceId: string;
  claim: string;
  attribution: ClaimAttribution;
};

export type PreparedEvidenceAnswer = {
  markdown: string;
  evidence: ClaimEvidence[];
};

function attributionFrom(context: string): ClaimAttribution {
  if (/\{\{Speculative\}\}/.test(context)) return "Speculative";
  if (/\{\{Derived\}\}/.test(context)) return "Derived";
  return "Direct";
}

function tableCellContext(line: string, citationOffset: number) {
  if (!line.trimStart().startsWith("|")) return null;

  const boundaries: number[] = [];
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === "|") boundaries.push(index);
  }

  for (let index = 0; index < boundaries.length - 1; index += 1) {
    if (citationOffset > boundaries[index] && citationOffset < boundaries[index + 1]) {
      return line.slice(boundaries[index] + 1, boundaries[index + 1]).trim();
    }
  }

  return null;
}

function sentenceContext(line: string, citationOffset: number) {
  let start = 0;
  const before = line.slice(0, citationOffset);
  const priorBoundary = /[.!?](?:\s+|$)/g;
  for (const match of before.matchAll(priorBoundary)) {
    start = (match.index || 0) + match[0].length;
  }

  let end = line.length;
  const after = line.slice(citationOffset);
  const nextBoundary = after.match(/[.!?](?=\s|$)/);
  if (nextBoundary?.index !== undefined) {
    end = citationOffset + nextBoundary.index + 1;
  }

  const candidate = line.slice(start, end).trim();
  const withoutCitation = candidate.replace(/\[S\d+\]/g, "").replace(/\{\{(?:Derived|Speculative)\}\}/g, "").trim();

  if (withoutCitation.length >= 12) return candidate;
  return line.trim();
}

function citationContext(text: string, absoluteOffset: number) {
  const lineStart = text.lastIndexOf("\n", absoluteOffset - 1) + 1;
  const nextLineBreak = text.indexOf("\n", absoluteOffset);
  const lineEnd = nextLineBreak === -1 ? text.length : nextLineBreak;
  const line = text.slice(lineStart, lineEnd);
  const offsetWithinLine = absoluteOffset - lineStart;

  return tableCellContext(line, offsetWithinLine) || sentenceContext(line, offsetWithinLine);
}

function cleanClaim(context: string) {
  return context
    .replace(/\[S\d+\]/g, "")
    .replace(/\{\{(?:Derived|Speculative)\}\}/g, "")
    .replace(/`Artist Witness`/g, "Artist Witness")
    .replace(/[*_~`>#]/g, "")
    .replace(/^\s*[-+]\s+/, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

export function prepareEvidenceMarkdown(text: string, validSourceIds: Set<string>): PreparedEvidenceAnswer {
  const evidence: ClaimEvidence[] = [];
  let sequence = 0;

  const withEvidenceLinks = text.replace(/\[S(\d+)\]/g, (token, number: string, offset: number) => {
    const sourceId = `S${number}`;
    if (!validSourceIds.has(sourceId)) return token;

    const context = citationContext(text, offset);
    const claim = cleanClaim(context);
    const href = `#claim-evidence-${sequence}`;
    sequence += 1;

    evidence.push({
      href,
      sourceId,
      claim: claim || "This claim is linked to the cited source.",
      attribution: attributionFrom(context),
    });

    return `[${number}](${href})`;
  });

  return {
    markdown: withEvidenceLinks.replace(/\{\{(Derived|Speculative)\}\}/g, (_token, kind) => `\`${kind}\``),
    evidence,
  };
}
