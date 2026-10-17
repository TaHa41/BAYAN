# BAYAN AI Engineer — Operations and Safety

## Status

This is the operating contract and phased acceptance plan, not a claim that the full agent is implemented or production-verified. Ship and verify phases independently. Existing project components include a five-minute Cron trigger, `selfHeal`, `runtime_events`, repair job/attempt records, and Telegram notifications; reuse them only after confirming their live schema and behavior.

## Autonomy policy

| Tier | Allowed behavior | Gate |
| --- | --- | --- |
| T0 | Bounded reads, synthetic checks, diagnosis, reports | Automatic; read-only |
| T1 | Explicitly allowlisted reversible operational actions | Rate limit, audit, kill-switch check immediately before action |
| T2 | Small code repair in isolated branch/PR | Regression test, full CI, preview/canary and path/risk policy; merge only if every gate passes |
| T3 | Schema/data/auth/secrets/validation/truth-prompt/DNS/feature-removal changes | Human approval required |
| T4 | Production data deletion, secret disclosure, weakening evidence checks, fabricated content, disabling audit/kill switch | Prohibited |

A prompt is not an authorization boundary. Enforce tiers server-side, independently of model output.

## Incident lifecycle

`detected → investigating → proposed → implemented → tests-passed → production-verified → closed-after-monitoring`

Other states: `still-open`, `rolled-back`, `human-approval-required`. Status alone is not proof of success.

Each incident should include a stable signature, bounded/redacted evidence, hypotheses, risk, baseline SHA, branch/PR references, verification results, rollback count, visitor impact, and audit trail. Avoid storing raw visitor reports, full search queries, credentials, or unnecessary personal information.

## Monitoring

Use the existing five-minute schedule for inexpensive, bounded checks without broad D1 scans:
- Home, published article, section, Arabic/English search smoke tests; admin rejects unauthenticated access.
- News cache age, eligible publication count, publish rejection reasons, RSS/provider failures.
- Search-provider status/latency/quota errors; never substitute fabricated or internal-only results.
- Sample image URLs, alt text, and forbidden image hosts such as Googleusercontent.
- Language/dir, canonical, hreflang, robots, sitemap and news-sitemap HTTP/XML validity.
- Live-data freshness and graceful degradation.
- D1/CPU/timeouts and scheduled-task heartbeat.
- Public error leakage, secret patterns in logs, duplicate/empty content.
- Contradictory health results: a passing check must not mask a failing related check.

Use fixed non-sensitive probes, strict timeouts, indexed reads and LIMIT. Do not log arbitrary query text or report bodies.

## Repair and rollback gates

- Only a server-side allowlist may execute T1. Audit each action, enforce rate limits, and prove a reversal path.
- One autonomous PR open at a time; no more than three per day by default; one unrelated change at a time.
- Every code fix includes a regression test that fails before the fix. Never weaken existing tests or thresholds.
- Do not auto-merge if CI, preview, canary, test reproduction, path allowlist, risk classification, or baseline checks are missing or ambiguous.
- Repeat the exact failing check on production and monitor at least two cycles, or 24 hours for slow faults.
- If verification fails, do not close the incident. Roll back only through a supported, audited mechanism. Stop and escalate after two consecutive failures.
- Schema/data actions are T3. Never edit applied migrations. Verify the live migration table and prove backup restoration in an isolated database before an approved production mutation.

## Kill switch and budgets

Check an authenticated admin kill-switch setting before every automatic action. If the setting is disabled or unreadable, fail closed for T1/T2. Keep T0 read-only diagnostics separately controllable.

Budget AI calls, D1 reads, and PR creation per day. Reduce noncritical checks first as limits approach and protect visitor search capacity. Send rate-limited warnings.

## Telegram and support

Send immediate critical alerts, a morning summary and a weekly report. Deduplicate by signature/type. T3 approval must be authenticated, expire, bind to an immutable action/commit, and be auditable; a generic callback must not approve changed content.

Treat visitor reports as untrusted. Classify technical issue, incorrect information, wrong image, broken link, or suggestion. Redact personal-data patterns, rate-limit, keep reports private, and never let a report directly trigger code changes or publish unverified claims.

## Secret names (never values)

- `BAYAN_AI_MANAGER_TOKEN` — existing admin authorization.
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — Telegram notifications.
- `GITHUB_AUTOFIX_TOKEN` — optional fine-grained token scoped only to this repository, with minimum permissions for branches/commits/PRs/check reads. Do not configure until the workflow is implemented and audited.
- AI-provider credentials only when required by the chosen provider; use secret storage/bindings.

Never place secrets in source, commits, prompts, issues, runtime events, or chat.

## Shutdown

1. Disable the kill switch in authenticated admin settings.
2. Confirm the scheduler refuses T1/T2 actions.
3. Revoke/remove the optional GitHub token in Cloudflare if code automation must stop.
4. Preserve incident/audit history; do not clear tables.
5. Verify a synthetic action is refused and refusal is audited.

## Acceptance phases

1. Monitor + persisted results + Telegram; an intentionally broken preview check reaches Telegram within two cycles.
2. Detector with stable signatures, deduplication, severity and incident linkage.
3. Read-only diagnoser evaluated against ten historical incidents: at least seven correct classifications, with explicit uncertainty when evidence is insufficient.
4. T1 allowlisted actions with rate limits, audit and rollback.
5. T2 PR + regression test + CI + canary; inject a SQL-column fault in preview and repair without weakening tests.
6. Verifier, rollback and runbook memory.
7. Budgets, kill switch and audit trail.
8. Private support desk and incident linkage.
9. Preview-only chaos tests and daily/weekly reports.

## Verification rule

Code presence, a green unit test, PR merge, or deployment command alone is not proof. Record commit SHA, CI/preview result, production check output and monitoring window. If any is missing, report: «غير مؤكد — يحتاج فحصًا فعليًا».
