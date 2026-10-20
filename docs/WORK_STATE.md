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
