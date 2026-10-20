---
name: bayan-maintenance
description: Safely maintain the BAYAN Arabic-English evidence-first knowledge site on Cloudflare Workers and D1. Use for repository audits, bug fixes, tests, deployment verification, image/news quality, search, and production reliability.
---

# BAYAN Maintenance Skill

## Mandatory safety rules

- Treat `TaHa41/BAYAN` main as production-bound; inspect current main and open pull requests before editing.
- Preserve Cloudflare Workers, the existing D1 database `bayan-knowledge`, all production data, and existing migrations. Never move or duplicate the database into Supabase without a demonstrated requirement and an approved migration plan.
- Never claim a fix, test, merge, or deployment succeeded without inspecting the actual result.
- Make focused changes with regression tests. Do not weaken existing tests, delete content, or change old migrations to hide failures.
- Never commit secrets, tokens, credentials, production data, or sensitive logs.
- Do not run active security testing against production by default. Use an authorized local/staging target and bounded Strix budgets.
- Preserve Arabic RTL for `?lang=ar` and English LTR for `?lang=en`.
- Never fabricate news, sources, article images, metrics, or verification results.

## Preferred workflow

1. Read `docs/ARCHITECTURE.md`, `docs/INTEGRATIONS.md`, `docs/PHASE_REPORTS.md`, and `docs/FEATURE_LEDGER.md` when present.
2. Inspect the relevant implementation, tests, migrations, workflows, and open pull requests before making a change.
3. Implement the smallest defensible fix and add a regression test.
4. Run `npm run check`; for browser behavior, run `npm run test:e2e` after installing Playwright Chromium.
5. Use Context7 for current library documentation when version-sensitive behavior matters.
6. Use Strix only with explicit scope, a configured model key, Docker available, and a bounded budget.
7. Deploy only through the repository's main-branch GitHub Actions release workflow.
8. Verify the deployed commit identity and live behavior before reporting success.
9. Record evidence and unresolved blockers in the relevant project documentation.
