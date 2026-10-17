# BAYAN Phase Reports

## Phase 0 — Intake and protection (2026-10-16)

- **Changes:** Added `docs/FEATURE_LEDGER.md` and `docs/ARCHITECTURE.md` on branch `repair/phase-0-ledger-architecture`. The ledger records required features, explicit exclusions, and safety invariants. The architecture map records source-level modules, configured runtime components, and known schema tables while marking unverified items as pending.
- **Behavior/data impact:** Documentation-only. No application source, migration, secret, or production data was changed.
- **Commits:** `4fd177c93025f19c99901ef3d7b6ad4717cc7c1a` (feature ledger); `fe82e1e3412d7fa9f1591894bb173313398a1440` (architecture map); merged through PR #341.
- **Tests:** CI passed for PR #341 before merge.
- **Deployment/live verification:** Documentation-only; no Worker deployment was required.
- **Acceptance:** The Phase 0 documentation is merged into `main`.
- **Remaining:** Full code/runtime audit continues in subsequent phases.

## Phase 1 — Production D1 inventory, Time Travel checkpoint, and first fixes (2026-10-16)

- **Production inventory confirmed by owner review:** `articles=162`, `knowledge_articles=24`, `news_archive=524` with no `article_slug`, `article_attempts>=2` count `66`, `repair_jobs=167`; legacy migration history ends at `0015` and application migration history at `0034`. The schema has `repair_jobs.last_action` and `verification_json`, not `action` / `verification`.
- **D1 Time Travel checkpoint:** Read directly from Cloudflare D1 API for database `bayan-knowledge` (database ID `7f43f467-baec-4770-a5e1-52e65abf348d`) at **2026-10-16T06:13:22.524Z**. Bookmark: `00000de0-00000054-00005106-18b7520670d0c8639fbf264a08f49e78`.
- **Backup caveat:** The bookmark is a temporary recovery checkpoint, not proof of a successful SQL export/restore. Export restore to a separate database and row-count comparison remain open. The bookmark was recorded before the production schema change. No bulk attempt counters were reset.
- **LIKE/GLOB fix deployed:** Bounded internal archive and knowledge-base search patterns by UTF-8 byte length (40-byte keyword cap, max 42 bytes including wildcards), split long tokens, and escaped `%`, `_`, and `!`. The internal Knowledge Base query failure was confirmed in production logs as `D1_ERROR: LIKE or GLOB pattern too complex`. Regression tests cover long Arabic and English queries and ensure the internal provider failure is surfaced to the per-provider fallback rather than swallowed.
- **Publication reason details deployed:** Added `news_archive.article_last_detail` through new migration `0035_news_archive_article_reason_detail.sql` plus schema compatibility logic. The existing `article_last_reason` / `publishReason` instrumentation was retained, not rebuilt. The publisher now distinguishes empty/AI-unavailable drafts, unsupported specifics, verification status, image rejection, and precise publication-quality rejection. Low-evidence items are marked `skipped_low_evidence`, release the claim attempt, and are deferred for six hours; evidence thresholds were not weakened.
- **CI and deployment:** CI passed for commit `8ff8ce7463d735766feaf0a28dc6f328c778a1c7`; Cloudflare Worker deployment succeeded and the deployment workflow's production verification passed. The separate lightweight health monitor still reported the known news-publication gap (`sitemapCount=0`, 200 archive candidates, 0 eligible published news articles) before two post-deploy publication cycles had elapsed. This is not a success claim for news publication.
- **Targeted production baseline:** News archive item `11686` (English) had two `draft_not_verified` attempts; runtime logs show OpenAI `http_429` during both attempts, but the exact final fallback verification rejection was not recorded historically. Item `11759` (Arabic) had `publish_rejected` with 7 sources and 5 publishers. Their new detail fields remain null because retry counters were not reset and those rows have not been retried.
- **Rate-limited catch logging:** A follow-up branch `repair/phase-1-rate-limited-runtime-events` adds `recordRuntimeEventLimited`, which caps each event kind to one D1 log write per minute per Worker isolate, sanitizes secrets/URLs, and never throws if telemetry itself fails. It has not yet been merged or deployed; CI is pending.
- **Remaining:** Observe two scheduled publication cycles after the latest deployment and inspect their reasons/results; complete the catch-logging branch and its CI/deployment; finish the isolated D1 export/restore row-count comparison; then address any dominant rejection reason without relaxing validation.


### Follow-up checkpoint — 2026-10-17

- **D1 Time Travel bookmark refreshed before any further production data mutation:** Cloudflare D1 API read for `bayan-knowledge` (database ID `7f43f467-baec-4770-a5e1-52e65abf348d`) at **2026-10-17T00:41Z** (UTC, minute precision; this is the observation time, not a claimed Cloudflare-provided timestamp). Bookmark: `00000ec4-00000056-00005107-83804beb6489d352a655881a5eac2762`.
- **Restore test:** Still open. This bookmark is a recovery point only; it does not prove an SQL export can be restored to a separate database.
- **Current production evidence:** Latest sampled provider diagnostic at `2026-10-17T00:35:52.868Z` records the provider chain without the previous LIKE/GLOB exception text. Latest publication-gate events show `draft_not_verified / unsupported_specifics` for IDs 12358, 12382, and 12407 despite 6–8 independent publisher labels and 8–12 sources. OpenAI answer generation reports `http_429` at the same cycles. The LIKE fix is present in `src/search-patterns.ts` and wired into internal article/knowledge search; a fresh direct long-query regression run against production still needs an explicit result before claiming full live acceptance.
- **Current queue snapshot:** `news_archive` contains 742 unlinked rows (366 Arabic, 376 English); 74 have exhausted attempts (62 Arabic, 12 English); 22 are deferred as `skipped_low_evidence`. No rows are linked to published articles in the sampled join. These are point-in-time counts and can change with cron ingestion.
- **No attempt reset:** No production attempt counters were reset. The SQL export/restore test and two-cycle publication acceptance remain open.
