# The Council of Time

A Cloudflare-first, mobile-first deliberative round table for difficult questions.

## Architecture

- React + Vite front end
- Cloudflare Worker API at `/api/council`
- Lightweight source-grounded table planning at `/api/table-plan`
- Workers AI with primary and fallback models
- No application-level server-side conversation database
- Short rolling transcript supplied by the browser for multi-turn continuity
- Curated source registry with clickable inline citations and source cards
- Mandatory Artist Witness selection for substantive initial tables
- Explicit fault-line pause state via `PAUSE_QUESTION`
- Source-roster continuity across fault-line resume turns
- Cloudflare Worker version metadata exposed through `/api/health` for deployment verification

## Source model

The public Worker receives a curated set of source titles, URLs, topic metadata, and interpretive guardrails. It does **not** currently fetch and read the linked source pages at request time.

That means the source layer is appropriate for disciplined, broad attribution and for linking the reader to relevant primary or authoritative material, but it should not be described as live document retrieval. Narrow textual claims should remain conservative unless the relevant evidence has been explicitly curated into the source context.

Current-event questions are an additional limitation: the public Worker does not yet have live web verification. The Council prompt is instructed not to manufacture current facts, but a true facts-first current-events mode will require a live research layer before that capability should be marketed as complete.

## Local development

```bash
npm install
npm run dev
```

Workers AI calls require Cloudflare authentication because the AI binding is remote.

## Deploy

```bash
npx wrangler login
npm run deploy
```

The production Worker runs on Workers Paid. Cloudflare budget alerts can provide spend warnings, but they are not a hard runtime spending cap. Keep model fallbacks, token budgets, request limits, and billing alerts aligned with the project's cost target.

## Privacy design

The application does not persist conversations in its own database and does not intentionally log request bodies or user prompts. The browser sends a short rolling transcript with each Council request so multi-turn reasoning works without application-level chat history.

Cloudflare platform observability is enabled for operational diagnosis. Platform invocation metadata and the app's structured operational logs may therefore be retained according to Cloudflare's observability settings. The app's custom logs record operational fields such as request ID, model, latency, fallback depth, and error details—not conversation text.

## Integrity rules

- Anthony Bourdain is a documented moderator/witness, never an impersonation.
- Major tables generally use 5–9 relevant participants; focused questions may use fewer.
- Every substantive initial table includes at least one relevant Artist Witness.
- Direct claims are source-grounded and unbadged.
- Present-day applications are marked `Derived` or `Speculative` when the evidentiary distance matters.
- Case material about a named subject does not make that subject a Council member.
- A genuine decision-bearing fault line pauses the table before synthesis.
- No fabricated quotations, source IDs, intentions, or forced consensus.

## Migration policy

Do not delete the old Vercel Council projects until the Cloudflare build has passed production acceptance tests and the final custom domain has been moved successfully.
