# Cloudflare migration runbook

## Phase 1 — Canonical source of truth
- [x] Use `U-Adam/council_of_time` as the only canonical repository.
- [x] Scaffold React + Vite + Cloudflare Worker application.
- [x] Add Workers AI binding.
- [x] Keep conversation state stateless on the server.
- [x] Add clickable citation IDs and public source registry.
- [x] Add `Bourdain pauses the table` fault-line continuation state.

## Phase 2 — Cloudflare account connection
- [ ] Human checkpoint: authorize Cloudflare access / connect GitHub repository.
- [ ] Create Worker project `council-of-time` on Workers Free.
- [ ] Configure build command: `npm run build`.
- [ ] Configure deploy command: `npx wrangler deploy` if required by the build integration.
- [ ] Confirm Workers AI binding `AI` exists.
- [ ] Confirm `COUNCIL_MODEL=@cf/google/gemma-4-26b-a4b-it`.

## Phase 3 — Production verification
- [ ] `/api/health` returns HTTP 200.
- [ ] Ask a general moral question and receive a Council response.
- [ ] Verify citation links open successfully.
- [ ] Trigger a genuine fault line and verify the UI waits for the user's answer.
- [ ] Answer the pause question and verify the same conversation continues.
- [ ] Verify mobile layout at iPhone width.
- [ ] Verify no request-body logging or conversation database is enabled.
- [ ] Verify quota exhaustion fails closed rather than creating paid AI usage.

## Phase 4 — Domain cutover
- [ ] Add `counciloftime.com` as the custom domain.
- [ ] Verify HTTPS and redirects.
- [ ] Keep the last working Vercel build untouched for 48 hours.

## Phase 5 — Cleanup
- [ ] Delete obsolete Vercel Council projects only after Cloudflare has passed all production checks.
- [ ] Retain only the canonical GitHub repository and Cloudflare Worker.
