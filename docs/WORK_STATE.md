# BAYAN Work State

Updated: 2026-10-20 09:45 Asia/Cairo (06:45 UTC)
Branch: repair/work-state-d1-audit
Base observed on main: 1e2aa8336f292c0e39159e63b56d23e721e8bf0b
Production origin: https://bayan.tahaomar411.workers.dev

| Item | State | Evidence | Next action | Next check |
|---|---|---|---|---|
| D1 daily read quota | blocked-time | Cloudflare D1 REST query returned error 7500: exceeded D1 Free daily row read limit; official Cloudflare docs say reset at midnight UTC | Retry only bounded schema/index/EXPLAIN queries after reset; record meta.rows_read per query | 2026-10-21 00:05 UTC / 03:05 Asia/Cairo |
| Measure top D1 consumers | blocked-time | Current read quota prevents executing D1 queries; source shows publisher read-call counter but not actual rows_read accounting | Capture query plans and rows_read for queue, health, archive, public routes and cron; calculate daily estimate | 2026-10-21 00:05 UTC / 03:05 Asia/Cairo |
| News queue query | doing | src/services/news-article-publisher-query.ts uses correlated NOT EXISTS with lower(trim(attempted.title)) and no title_key index; query sorts candidates and reads admin setting in ORDER BY | Design an indexed normalized-title strategy or bounded indexed candidate/rejection set; do not change 5-publisher gate; add regression tests | After D1 reset, before migration proposal |
| D1 budget guard | doing | src/services/news-article-publisher.ts counts read method calls/reservations (DAILY_D1_READ_CALL_LIMIT=12000, reservation=120), not actual rows_read returned by D1 | Replace/augment call-count guard with conservative measured row-read budget; ensure telemetry is bounded and does not recurse into D1 failure | Code review + tests |
| Production deployment identity | doing | Cloudflare API lists deployment 63823e43-be91-4130-8760-0596f87bcfc4 at 2026-10-20T06:28:09Z; latest observed main commit is 1e2aa8336f292c0e39159e63b56d23e721e8bf0b | Verify /.well-known/build.json and GitHub Actions deploy/check steps; browser fetch was inaccessible | Next available network/CI evidence |
| Deploy-time self-heal safety | doing | .github/workflows/deploy-worker.yml calls scripts/production-self-heal.mjs; script can POST /api/admin/repair and execute up to 4 repair passes when initial smoke fails and token exists | Make deploy verification read-only by default; require explicit approval for repair actions; inspect #440/#441 relationship before changes | During non-D1 work |
| Social preview image | blocked-owner | PR #443 currently proposes public/og-bayan.svg and references SVG; request requires a real PNG/JPG at public/og/bayan-og.png; exact supplied image bytes are not present in repo evidence inspected | Owner uploads the already-designed bayan-og.png, or provides its exact asset file; do not fabricate a replacement or change metadata to a nonexistent path | When asset is available |
| Production smoke safety | doing | Current deploy workflow invokes production-self-heal; PR #440 changes a separate workflow's manual smoke to production-smoke.mjs, but does not remove deploy workflow repair call | Audit all workflow triggers and scripts; no automatic mutations in audit-only tests | During non-D1 work |
| npm run check / CI | todo | package.json defines npm run check; current GitHub combined status response for latest main commit returned no status entries | Run locally when checkout/tooling available and verify actual Actions run/job logs before claiming pass | Before any merge/deploy |
| Production acceptance criteria | todo | No direct live HTTP confirmation of build.json, API/news, OG image or bilingual sections obtained in this session; D1 quota blocks database-backed checks | Run bounded production smoke after quota reset and compare results with the intended SHA | After fixes and deploy |

## Evidence-based findings
- Cloudflare D1 query attempt failed with error 7500 because the account exceeded the daily Free-tier row-read limit. No production data was changed.
- Cloudflare's official pricing documentation states D1 Free includes 5 million rows read/day and 100,000 rows written/day; Workers Free has 100,000 requests/day and 10 ms CPU time per invocation. See https://developers.cloudflare.com/workers/platform/pricing/ and https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/.
- The current publisher queue source includes a correlated title comparison using lower(trim(title)); actual rows_read and EXPLAIN QUERY PLAN remain unmeasured.
- The existing daily publisher guard counts read calls/reservations, not the actual row-read metadata. It therefore cannot by itself prove the daily row-read budget is safe.
- The deploy workflow calls production-self-heal.mjs. That script may invoke an authenticated repair endpoint after failed smoke checks; PR #440's non-destructive smoke change is in a different workflow and does not alone establish that deploy-time repair is disabled.
- No source or production data has been modified by this audit branch beyond this state document.
