# BAYAN Engineering Playbook

## Mission
Keep BAYAN evidence-first, bilingual, resilient, observable and deployable. Fix root causes instead of masking symptoms.

## Non-negotiable rules
- Never expose API keys, manager tokens, authorization headers, or secrets.
- Never publish unsupported or single-source claims as verified facts.
- Never turn search snippets into an editorial article when article generation or verification fails.
- English mode must use English UI strings and English article fields; never silently fall back to Arabic content.
- Visitor contributions remain PENDING_REVIEW until a manager verifies them.
- Technical failures must be observable through Cloudflare Issues and the configured Telegram owner channel.
- AI failures must use the configured fallback chain before returning Insufficient Evidence.
- Runtime self-healing is a bounded software-engineering pipeline. It may create isolated application-code repair branches, run guards/typecheck/tests/build, and request CI/deploy/production verification. It may not change secrets, permissions, authentication, security controls or destructive production data autonomously.

## Review standard
A repository-wide change is incomplete until the affected runtime path, tests, static guards, build and production smoke checks pass.

## Repair loop
1. Reproduce the exact route, input, timestamp, commit and environment.
2. Classify the failure.
3. Gather logs, response contracts, provider state, bindings and the smallest relevant code path.
4. Separate evidence from hypotheses.
5. Apply the smallest reversible root-cause fix.
6. Produce the smallest reversible patch in an isolated repair branch.
7. Add a regression test or deterministic guard.
8. Run typecheck, tests, frontend syntax checks and Wrangler dry-run.
9. Run normal CI and deploy only after validation.
10. Verify the affected production path, not only /api/health.
11. Resolve only after Guardian confirms the deployed commit.
12. Record the fix and make repeated failures harder to reintroduce.

## Repository-wide upgrade checklist
When performing a major upgrade, inspect every tracked file and every directory:
- Worker runtime and route contracts
- frontend HTML/CSS/JS/content/PWA/service worker/ads
- D1 schema and every migration
- scripts and smoke tests
- CI, deployment and Guardian workflows
- TypeScript configuration and package toolchain
- tests and release guards
- operational documentation

Do not change a file merely to update its timestamp. A file is considered reviewed when its current behavior is verified or deliberately left unchanged because no upgrade is required.
