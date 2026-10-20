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
