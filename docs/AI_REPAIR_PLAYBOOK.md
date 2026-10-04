# BAYAN AI Repair Playbook

BAYAN AI is a bounded autonomous software-repair engineer. It is not merely a diagnostic chatbot.

## What BAYAN is built on

BAYAN runs as a Cloudflare Workers TypeScript application with:
- Cloudflare D1 (bayan-knowledge) for knowledge, analytics, moderation and repair state.
- Cloudflare Assets for the SPA frontend.
- Workers AI + AI Gateway and Cloudflare AI Search.
- OpenAI Responses API as a server-side AI provider/fallback.
- Multi-provider evidence retrieval, RSS/news providers, Wikimedia/Wikidata/Wikipedia and deterministic live-data providers.
- GitHub Actions for CI, production deployment and Guardian verification.
- Telegram as the configured owner notification channel.
- PWA, bilingual Arabic/English UI, SEO, protected manager APIs and production smoke tests.

The complete product and architecture contract is in docs/BAYAN_SYSTEM_SPEC.md.

## Repair state machine

DETECTED -> DIAGNOSING -> PATCHING -> TESTING -> CI_VERIFY -> DEPLOYING -> PRODUCTION_VERIFY -> RESOLVED

Exceptional states:
- EXTERNAL_DEPENDENCY: provider/quota/credential/platform failure outside application code.
- WAITING_HUMAN: secret, permission, security-boundary, destructive or ambiguous high-risk change.
- REPAIR_FAILED: evidence-backed repair attempt failed verification.
- ROLLED_BACK: an autonomous repair reached production and was reverted after Guardian detected a regression.

The D1 repair_jobs record persists phase, root cause, risk level, branch, PR, verification data and rollback count.

## Detection

Incidents may originate from:
- production smoke;
- Guardian runtime repair signal;
- scheduled bounded runtime audit;
- client-side error reporting;
- Worker exceptions;
- provider failures;
- D1/schema failures;
- AI capability regressions.

The same normalized root cause must not create an unlimited stream of duplicate attempts.

## Diagnosis

The engineer receives:
1. exact failure evidence;
2. deployed commit;
3. production smoke/Guardian reports;
4. relevant repository files;
5. this playbook and the full BAYAN system specification.

It must separate evidence from hypotheses and identify the smallest root cause.

## Patch

The AI repair runner:
- creates ai-repair/<commit> from the failing commit;
- sends bounded repository context to the AI;
- allows at most four changed files for an ordinary repair;
- rejects workflow edits, secrets, permissions, authentication/CSP weakening and destructive migrations;
- prefers deterministic application fixes;
- adds or updates a regression test when practical;
- applies the smallest reversible unified diff.

## Verification

Local verification is mandatory:
1. npm run guards
2. npm run typecheck
3. npm test
4. npm run build

A failed verification permits only one evidence-based correction attempt.

Then:
1. the repair branch is pushed;
2. a PR is created;
3. BAYAN CI is explicitly dispatched on the repair branch;
4. the PR is merged only after that CI succeeds;
5. production deployment runs from current main;
6. Guardian runs production smoke and runtime repair-signal checks;
7. only then is the incident considered resolved.

Generating code is never equivalent to resolving the incident.

## Safe rollback

If the deployed commit itself is an autonomous AI repair commit and Guardian detects a production regression, ai-rollback.yml creates an isolated revert branch, runs normal CI, merges only after CI succeeds, then lets deployment and Guardian verify the rollback.

The AI repair workflow does not try to patch on top of a failed autonomous repair commit; rollback owns that recovery decision first.

## Risk policy

### AUTO-FIX
Clear, deterministic, low-risk application defects.

### AI-FIX + VERIFY
Normal application-code changes with bounded scope, regression checks, CI, deployment and Guardian verification.

### WAITING_HUMAN
Secrets, authentication/authorization, permissions, security-boundary changes, destructive migrations, production-data deletion, billing/external-account changes or ambiguous high-impact behavior.

### EXTERNAL_DEPENDENCY
OpenAI/Cloudflare AI quota, third-party outage, missing external credential, provider failure or platform limitation.

## Never do

- Never expose secrets in AI prompts, logs, PRs or artifacts.
- Never delete production data.
- Never weaken security controls.
- Never bypass the evidence/publication gate.
- Never publish raw visitor contributions as verified knowledge.
- Never mark a failure resolved because a patch merely compiled.
- Never loop indefinitely on the same root cause.
