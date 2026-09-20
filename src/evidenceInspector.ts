import { CITATION_MARKER, parseClaimEvidence, type ClaimAttribution } from "./evidence";

const ATTRIBUTION_COPY: Record<ClaimAttribution, string> = {
  Direct: "The cited source explicitly supports the material claim being made. The Council may paraphrase, but it should not extend the source beyond what it actually establishes.",
  Derived: "This is a present-day application that strongly follows from the cited framework, even though the source did not address this exact case.",
  Speculative: "This is a plausible but weaker, contested, historically remote, or interpretively ambitious extrapolation. Treat it with more caution.",
};

function sourceInfo(cite: HTMLAnchorElement) {
  const storedId = cite.dataset.sourceId;
  const storedTitle = cite.dataset.sourceTitle;
  if (storedId && storedTitle) return { id: storedId, title: storedTitle };

  const label = cite.getAttribute("aria-label") || "";
  const match = label.match(/^Open source (S\d+):\s*(.+)$/s);
  if (!match) return null;
  return { id: match[1], title: match[2] };
}

function decorateCitation(cite: HTMLAnchorElement) {
  if (cite.dataset.evidenceReady === "true") return;
  const source = sourceInfo(cite);
  if (!source) return;

  cite.dataset.evidenceReady = "true";
  cite.dataset.sourceId = source.id;
  cite.dataset.sourceTitle = source.title;
  cite.setAttribute("aria-label", `Inspect evidence for ${source.id}: ${source.title}`);
  cite.setAttribute("title", "Why this claim? Tap to inspect the evidence path. Modifier-click opens the source directly.");
}

function decorateCitations(root: ParentNode = document) {
  root.querySelectorAll<HTMLAnchorElement>("a.inline-cite").forEach(decorateCitation);
}

function serializeNode(node: Node, target: HTMLAnchorElement): string {
  if (node === target) return ` ${CITATION_MARKER} `;
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
  if (!(node instanceof HTMLElement)) return "";

  if (node.classList.contains("attribution-badge")) {
    const label = node.textContent?.trim();
    return label === "Derived" || label === "Speculative" ? ` {{${label}}} ` : "";
  }
  if (node.classList.contains("artist-witness-badge")) return " Artist Witness ";

  return Array.from(node.childNodes).map((child) => serializeNode(child, target)).join("");
}

function claimContext(cite: HTMLAnchorElement) {
  const block = cite.closest("td, p, li, blockquote") || cite.closest(".message-body");
  if (!block) return `${CITATION_MARKER}`;
  return serializeNode(block, cite);
}

function ensureDialog() {
  let dialog = document.querySelector<HTMLDialogElement>("#claim-evidence-dialog");
  if (dialog) return dialog;

  dialog = document.createElement("dialog");
  dialog.id = "claim-evidence-dialog";
  dialog.className = "evidence-dialog";
  dialog.setAttribute("aria-labelledby", "claim-evidence-title");
  dialog.innerHTML = `
    <div class="evidence-drawer">
      <button class="evidence-close" type="button" aria-label="Close evidence inspector">×</button>
      <div class="evidence-topline">
        <div class="section-kicker">Why this claim?</div>
        <span class="evidence-provenance" data-evidence-attribution></span>
      </div>
      <h2 id="claim-evidence-title">Evidence behind the claim</h2>
      <blockquote class="evidence-claim" data-evidence-claim></blockquote>
      <div class="evidence-detail">
        <span class="evidence-label">Attribution</span>
        <p data-evidence-definition></p>
      </div>
      <div class="evidence-detail">
        <span class="evidence-label">Source path</span>
        <strong data-evidence-source-title></strong>
        <small data-evidence-source-id></small>
      </div>
      <div class="evidence-detail evidence-guardrail">
        <span class="evidence-label">Integrity rule</span>
        <p>A citation is not a permission slip to speak beyond the source. The Council must preserve contested readings, distinguish doctrine from application, and narrow a claim when the evidence is weaker than the wording.</p>
      </div>
      <a class="evidence-source-link" data-evidence-source-link target="_blank" rel="noreferrer">Open source ↗</a>
    </div>
  `;

  const close = () => dialog?.close();
  dialog.querySelector<HTMLButtonElement>(".evidence-close")?.addEventListener("click", close);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  document.body.appendChild(dialog);
  return dialog;
}

function openEvidence(cite: HTMLAnchorElement) {
  const source = sourceInfo(cite);
  if (!source) return;

  const evidence = parseClaimEvidence(claimContext(cite));
  const dialog = ensureDialog();
  const drawer = dialog.querySelector<HTMLElement>(".evidence-drawer");
  const attribution = dialog.querySelector<HTMLElement>("[data-evidence-attribution]");
  const sourceLink = dialog.querySelector<HTMLAnchorElement>("[data-evidence-source-link]");

  dialog.querySelector<HTMLElement>("[data-evidence-claim]")!.textContent = evidence.claim;
  dialog.querySelector<HTMLElement>("[data-evidence-definition]")!.textContent = ATTRIBUTION_COPY[evidence.attribution];
  dialog.querySelector<HTMLElement>("[data-evidence-source-title]")!.textContent = source.title;
  dialog.querySelector<HTMLElement>("[data-evidence-source-id]")!.textContent = source.id;
  attribution!.textContent = evidence.attribution;
  attribution!.className = `evidence-provenance ${evidence.attribution.toLowerCase()}`;
  sourceLink!.href = cite.href;
  drawer?.scrollTo({ top: 0 });

  if (!dialog.open) dialog.showModal();
}

export function installEvidenceInspector() {
  decorateCitations();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (node.matches("a.inline-cite")) decorateCitation(node as HTMLAnchorElement);
          decorateCitations(node);
        }
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const cite = event.target.closest<HTMLAnchorElement>("a.inline-cite");
    if (!cite) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const source = sourceInfo(cite);
    if (!source) return;
    event.preventDefault();
    openEvidence(cite);
  });
}
