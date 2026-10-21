# BAYAN Work State

Last updated: 2026-10-20 22:26 Cairo (UTC+03:00)

## Current verified state

- Main commits merged during this execution:
  - PR #472 — D1 quota guard for runtime-event writes.
  - PR #474 — explicit degraded HTML shell when page rendering hits D1 quota.
  - PR #473 — freshness-first news queue selection and index-friendly candidate query.
  - PR #476 — manual production smoke no longer invokes self-heal or receives the repair-manager token.
  - PR #479 — Gemini provider integrated before existing fallbacks; OpenAI remains opt-in.
  - PR #484 — production smoke distinguishes explicit `degraded=true, reason=d1_quota` from empty content.
  - PR #485 — GDELT metadata discovery plus bounded, robots-aware publisher excerpts; strict five-publisher evidence floor, eTLD+1 normalization and syndicated-text checks.
  - PR #487 — server-rendered BreadcrumbList JSON-LD.
- CI for the exact PR heads passed before merge for the above PRs.
- Cloudflare Workers API last verified the deployed Worker source at 2026-10-20 19:24 UTC with `BAYAN_COMMIT_SHA=eacbda85e7646a633092080a9c70744454a1611e`; the deployed bundle contains both the GDELT integration and `BreadcrumbList` JSON-LD. The public `/.well-known/build.json` URL could not be fetched by the available web reader, so direct equality with its response remains **unverified**. The latest main commit after that is documentation-only and does not change Worker code.
- PR #486 is open and CI passed on its current head `deeeb188e2eb4ed22c246f32fb2eacb7f25341f4`. It repairs four literal-NULL trend image URLs using migration 0039. Do not merge or apply it until the D1 daily quota has reset and the branch has been refreshed against current main. PR #431 was closed because it used migration number 0038, which is already occupied by `0038_news_archive_queue_indexes.sql`.
- The missing-image runtime fallback from PR #469 is present in `public/app-20261019-01.js` on main. This proves the code is in the repository; an actual browser test of an article without an image is still required.
- `public/og/bayan-og.png` is absent from main. Do not change the social-preview path to that file until the owner uploads it. Existing SVG fallback remains; PNG preview acceptance is blocked.
- Gemini is integrated and deployed in code, but a real provider success using the configured secret has not been verified. Never print or read the secret value in logs.
- GDELT page-evidence code is merged, but the live evidence count, successful page fetches, and Arabic/English `news_archive.linked > 0` have not been verified. No D1 measurements were run while the quota was exhausted.

## Next exact check

**2026-10-21 03:05 Cairo (00:05 UTC).** After the D1 daily reset, run only bounded/read-only checks first:
1. Verify `/.well-known/build.json` against the then-current main SHA and confirm the newest Cloudflare deployment.
2. Measure actual `meta.rows_read` for news queue picks and the highest-cost public routes; record before/after and estimated daily total.
3. Read bounded counts for `news_archive` (total, linked, exhausted, per-language reasons) and inspect GDELT/provider diagnostics without resetting attempts or deleting rows.
4. Confirm at least one genuine Arabic and one genuine English article have five independent publishers, publisher-reported dates, valid evidence and safe images before claiming article publication is fixed.
5. Refresh PR #486 against current main, re-run all CI, then apply migration 0039 through the approved deployment path only if the quota is available. Verify the four targeted rows afterward.

## Still not proven

- Zero visitor 5xx during actual D1 quota exhaustion across every route.
- Actual D1 read totals and a measured reduction below the daily limit.
- Live Gemini authentication/provider success and fallback behavior.
- GDELT producing eligible, independent page evidence and article publication in both languages.
- Production image rendering, OG PNG previews, full section content quality, and Search Console indexing.
- Production HTML validation of canonical/hreflang/JSON-LD after the latest BreadcrumbList deploy.

Do not report any of these as resolved without production evidence.


## Execution update — 2026-10-20 21:38 UTC / 2026-10-21 00:38 Cairo

### Verified repository changes
- PR #490 merged: scheduled D1 quota catches stop before retrying telemetry writes; publisher budget exhaustion returns before an extra D1 event write. CI passed.
- PR #491 merged: indexed archive candidate bound reduced to 40 rows; queue query and source-contract tests updated. CI passed.
- PR #493 merged: GDELT DOC 2.0 query now scopes discovery with `sourcelang:arabic` / `sourcelang:english`; metadata cache and in-flight requests are isolated by language. CI passed.
- PR #495 merged: bilingual section-classification tests distinguish Mohamed Salah biography content from match reporting. CI passed.
- PR #494 merged: detailed article-quality inventory result sets are bounded; SQL remains read-only. CI passed.
- PR #496 merged: read-only post-deploy audit warns when sensitive Worker bindings are not `secret_text`, without printing values. CI passed.

### Deployment identity evidence
Cloudflare Worker deployment metadata showed the active `BAYAN_COMMIT_SHA` matching each of these merged commits at the time of verification:
- PR #490: `d46fa2c994d1ac5b8009946da2cd2d1bb1920e10`
- PR #491: `23ddd95a1d98e268905fb8b7e5d38844cca7c9f6`
- PR #493: `326f28b473b116affe1a4168b72345a14e7622a5`
- PR #495: `69340b967c8116d10b77d0f6f0dd7acd4ef5eb35`
- PR #494: `fdb1943e29eedf97375facee85ba7b9fa377a4ee`
- PR #496: `b59aa27068082800ce3febbd4750598d79a1a0a8`

This verifies Worker version metadata, not a direct successful read of `/.well-known/build.json` or successful end-to-end behavior for every route.

### Confirmed blockers and next check
- D1 row-read measurement has not been run because the free-tier quota was exhausted earlier. Next intended measurement window: **2026-10-21 03:05 Cairo (00:05 UTC)**. A one-time automation was created, but its API did not report a `next_run_time`; verify its execution rather than assuming it ran.
- The active Worker metadata still reports `SEARCH_API_KEY` and `GEMINI_API_KEY` as `plain_text`, not `secret_text`. Do not print their values. Owner action: rotate both provider credentials, add them as Worker Secrets under the same binding names, then verify search and Gemini fallback before removing any plaintext variables.
- `public/og/bayan-og.png` is absent from `main` (GitHub returned 404 for that path). PR-6 remains blocked until the owner uploads the PNG; do not point metadata at a missing asset.
- No production evidence yet proves D1 reads/day are safely below 5M, zero visitor 5xx during quota exhaustion, `news_archive.linked>0` for verified Arabic and English stories, successful end-to-end search provider fallback, or Search Console indexing.
- Latest confirmed archive/content snapshot remains historical; re-read only after quota reset. Never lower the five-independent-publisher threshold, reset attempt counters, or publish unverified stories.

### Next actions
1. At the measurement window, run the bounded read-only D1 query-plan/rows-read audit; stop immediately on quota errors and do not repeat the same query.
2. Confirm the latest Worker commit and the public build identity endpoint, then perform non-destructive route checks.
3. Verify the post-deploy sensitive-binding audit warning; owner must rotate and move the two named credentials to Secrets.
4. Continue only with evidence-backed repairs; leave the OG PNG, key rotation, and Search Console tasks marked as blocked until the required owner action or access is available.


## Execution checkpoint — 2026-10-21 03:13 UTC

- Live Worker commit: `4c49bc39869794eb514b7ff65eded254de4f8437`; deployment ID `7d388c07-d4f5-42a1-abe6-8c99ef490ba6`. The deployed binding audit reports `NEWS_PIPELINE_ENABLED=true` and `OPENAI_ENABLED` absent, so paid OpenAI remains off.
- Merged implementation PRs: #501 (initial D1 quota guard), #502 (indexed news-queue rewrite/contract tests), #500 (production smoke preflight abort), #503 (smoke assertions cannot silently pass), #504 (Egypt section check), #506 (topic-specific GDELT publisher-text recovery), #507 (global D1 quota interception), #508 (restore persisted quota block before all routes), #509 (designed section-image fallback), #511 (explicit OpenAI opt-in).
- Latest production check is still **red** for a specific reason: `news_publication_gap`; `archiveReady=200`, `candidateCount=0`, `urlCount=0`, `eligible=0`, `rejectedCount=0`. The health preflight itself is healthy, so the smoke audit reaches and reports the publication gap. Do not mark news publication resolved.
- GDELT topic recovery is deployed, but `news_archive.linked>0` in both languages is not yet proven. No D1 read-count measurement was run outside the requested first-hour window.
- A one-time measurement automation was created for 2026-10-22 00:05 UTC; the scheduler returned `next_run_time=null`, so execution time is not yet confirmed.
- Manual blockers: upload `public/og/bayan-og.png`; the deployed Worker version has a `GEMINI_API_KEY` `secret_text` binding, but the key's validity is **not verified** (do not expose it; rotate/update it only if a safe provider probe confirms authentication failure); identify the intended provider for the `SEARCH_API_KEY` currently stored as `plain_text` before wiring or rotating it; approve RSS sources before activation. Do not merge #348 or #275 without owner approval.


## 2026-10-21 — AI fallback investigation (not yet production-verified)

- PR #517 adds one daily AI-budget reservation per article-drafting attempt and a regression test for Gemini failure followed by Workers AI fallback.
- Initial CI found a stale source-contract assertion encoding the old per-provider budget guard. The contract now checks the single-reservation draft behavior and separately verifies OpenAI web-search circuit-breaker evaluation before that provider's budget reservation.
- `.env.example` documents Gemini and Workers AI configuration names without storing secrets. Deployed Worker bindings and secret validity remain unverified from this repository change.
- GDELT PR #339 was closed unmerged and its branch is 166 commits behind current `main`; do not merge that branch directly. Later GDELT topic-recovery work is recorded as deployed, but production linked-source diversity and news publication remain unverified.
- No production article publication or successful `scripts/production-smoke.mjs` result is claimed by this entry.


## 2026-10-21 — authenticated manual news trigger (PR pending)

- Added `POST /api/internal/trigger-news-pipeline` in `src/index.ts`. It uses the existing `BAYAN_AI_MANAGER_TOKEN` manager authorization, rejects non-POST requests, requires `NEWS_PIPELINE_ENABLED=true`, and applies a per-isolate five-minute cooldown.
- The endpoint calls the existing `publishNextArchivedNewsArticle` publisher; it does not insert article rows directly, bypass evidence checks, lower the five-independent-publisher/host threshold, or reset attempt counters. It records a bounded `news_archive_manual_trigger` runtime event and only returns an article URL when the publisher reports a published slug.
- Read-only production D1 check at this checkpoint: `news_archive=1697`, `linked=0`, `published_news=0`. The live Worker settings report `NEWS_PIPELINE_ENABLED=true`. Recent failures include `ai_unavailable` / Gemini timeouts and insufficient independent publishers. This confirms that cron timing is not the only blocker.
- Status: implementation and contract guard are merged in PR #521; CI passed (including typecheck, tests, source contracts, smoke contracts, and Worker build); PR #521 is merged. Cloudflare deployment `cc780839-f5a2-416e-bfac-6ee45f89e78c` at `2026-10-21T04:05:09.751Z` reports `BAYAN_COMMIT_SHA=a2742156705222230533c1422e5d59d5e081d519`. No authenticated production trigger call has been made, and no article is published yet. Do not mark the first article criterion complete until a real published slug is returned and verified in `/news-sitemap.xml`.
- A production trigger call requires the manager token in an authenticated POST. The token is not read or printed by this audit. Do not expose it in browser code, query strings, logs, or repository files.


## 2026-10-21 — GDELT recovery continuation

- Rebuilt the GDELT topic-recovery change on current `main` after the original PR #520 branch became merge-conflicted with the authenticated manual-trigger change.
- Corrected source-contract assertions to match the explicit `topic` / `language-fallback` query labels; the earlier CI failure was caused by stale literal expectations, not evidence that the intended fallback was absent.
- Added a 512 KiB cap before buffering/parsing GDELT metadata, with fallback to the language query and a bounded diagnostic when a topic response exceeds the cap.
- Added regression coverage for oversized metadata response fallback. PR #523 is merged and deployed as `1d521c63249dddb6350cb3a730946bef6eeb112b`; production smoke passed, but publication health still fails until a real article passes the unchanged five-independent-publisher evidence checks.


## 2026-10-21 — continuation checkpoint after PR #523

- PR #523 merged as `1d521c63249dddb6350cb3a730946bef6eeb112b`. CI passed on all three workflows before merge; Cloudflare deployment `01cdea2d-b6c3-445b-8a0d-e15b7f19eead` reports the same `BAYAN_COMMIT_SHA`.
- Production smoke passed, but post-deploy health remains failed: `archiveReady=200`, `eligible=0`, `newsArticleCount=0`. This is still the primary production blocker; no verified news article has been published.
- PR #524 merged as `e121aeaceea376d55f0e1174ec54909b57386837`: the secondary manual deploy workflow now requires `allow_repair=true` before invoking self-heal. CI passed.
- PR #525 merged as `eeea75269b0af1d3f4c3cb881e5211f8630f4450`: added a manually dispatched, one-attempt news trigger workflow with post-publication sitemap verification. It has not been manually run; do not treat it as publication evidence.
- D1 usage/rows-read measurement is deferred to the next post-reset window. Do not run broad D1 reads before that window.


## 2026-10-21 — conservative Gemini/Workers AI daily budget

- Cloudflare's active Worker version had `NEWS_AI_DAILY_LIMIT=150` as a plain-text variable. The connected account does not expose the project's active Gemini AI Studio rate-limit values, so the exact free-tier request/day ceiling is **unknown**.
- This change lowers the Worker-configured daily news-AI budget to 10 attempts and lowers the code fallback default to 10. It is a conservative guard, not proof that the project's account-specific free quota is 10 or higher.
- Google documents that limits vary by model, project tier, and account status, and directs owners to view active limits in AI Studio: https://ai.google.dev/gemini-api/docs/rate-limits
- OpenAI remains disabled unless `OPENAI_ENABLED=true`; no paid-provider opt-in is introduced here.


## 2026-10-21 — Ask BAYAN degraded search fix (pending PR)

- Found a concrete quota-path gap: `src/index.ts` returned the generic D1 degraded fallback before `/api/ask` could run the independent external-search recovery already present in `src/routes/api.ts`.
- This branch allows only `/api/ask` to bypass that early fallback; D1 remains guarded and schema setup is skipped when quota is already blocked. Successful responses carry `degraded=true`, `reason=d1_quota`, and `X-BAYAN-Degraded: d1_quota`.
- If all external sources fail, the route now returns an explicit insufficient-evidence message and does not ask AI to invent an answer.
- Added integration tests for quota-blocked external recovery and zero-results behavior. Pending CI and production deployment; no D1 query was run during this change.


- Follow-up PR #527 merged as `655b9b7f034fd41eeedaf4b3d37671e5c726e108`; Cloudflare now reports `NEWS_AI_DAILY_LIMIT=10` and the `GEMINI_API_KEY` binding remains `secret_text`. Post-deploy smoke passed, but health still reports `archiveReady=200`, `eligible=0`, `newsArticleCount=0`.
