# BAYAN Phase Reports

## Phase 0 — Intake and protection (2026-10-16)

- **Changes:** Added `docs/FEATURE_LEDGER.md` and `docs/ARCHITECTURE.md` on branch `repair/phase-0-ledger-architecture`. The ledger records required features, explicit exclusions, and safety invariants. The architecture map records source-level modules, configured runtime components, and known schema tables while marking unverified items as pending.
- **Behavior/data impact:** Documentation-only. No application source, migration, secret, or production data was changed.
- **Commits:** `4fd177c93025f19c99901ef3d7b6ad4717cc7c1a` (feature ledger); `fe82e1e3412d7fa9f1591894bb173313398a1440` (architecture map); merged through PR #341.
- **Tests:** CI passed for PR #341 before merge.
- **Deployment/live verification:** Documentation-only; no Worker deployment was required.
- **Acceptance:** The Phase 0 documentation is merged into `main`.
- **Remaining:** Full code/runtime audit continues in subsequent phases.

## Phase 1 — Production D1 inventory and backup checkpoint (2026-10-16)

- **Production inventory confirmed by owner review:** `articles=162`, `knowledge_articles=24`, `news_archive=524` with no `article_slug`, `article_attempts>=2` count `66`, `repair_jobs=167`; legacy migration history ends at `0015` and application migration history at `0034`. The schema has `repair_jobs.last_action` and `verification_json`, not `action` / `verification`.
- **D1 Time Travel checkpoint:** Read directly from Cloudflare D1 API for database `bayan-knowledge` (database ID `7f43f467-baec-4770-a5e1-52e65abf348d`) at **2026-10-16T06:13:22.524Z**. Bookmark: `00000de0-00000054-00005106-18b7520670d0c8639fbf264a08f49e78`.
- **Backup caveat:** The bookmark is a temporary recovery checkpoint, not proof of a successful SQL export/restore. Export restore to a separate database and row-count comparison remain open. No production data mutation is authorized until the bookmark is recorded (now satisfied), and any future production data change must still have an appropriate recovery plan.
- **Known source issue:** `src/services/search.ts` builds `LIKE` patterns from query terms in `searchRecentNewsArchive`; terms are not bounded by UTF-8 byte length. Long Arabic/English terms can trigger SQLite's “LIKE or GLOB pattern too complex” error. This is the next isolated code fix.
- **Tests/deployment:** No application change or Worker deployment in this checkpoint commit. No claim that the search error is fixed.
- **Remaining:** Isolated LIKE-pattern fix and regression tests; bounded logging for empty catches; independent restore test; then instrument exact draft/publication rejection reasons and fix the dominant causes.
