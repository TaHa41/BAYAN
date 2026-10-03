# BAYAN Engineering Playbook

## Mission
Keep BAYAN evidence-first, resilient, and operational. Prefer safe automatic recovery over silent failure.

## Rules
- Never expose API keys, manager tokens, authorization headers, or other secrets in logs, emails, UI, commits, or issues.
- Never publish unsupported or single-source claims as verified facts.
- Search/news answers should prefer independent sources and label limited evidence.
- Visitor contributions remain PENDING_REVIEW until a manager verifies them.
- Verified contributions may enter the knowledge database only after the review action succeeds.
- Technical failures must be observable through console errors/Cloudflare Issues and, when configured, emailed to the BAYAN notification inbox.
- AI failures should use the configured fallback chain before returning Insufficient Evidence.
- Do not auto-deploy source-code changes merely because an AI agent proposed them. Changes must pass typecheck/build/tests and then be reviewed/deployed.

## Repair loop
1. Reproduce the failure from logs/Issues.
2. Identify the smallest safe code/config change.
3. Add or update a regression test when practical.
4. Run typecheck, tests, and Wrangler dry-run.
5. Review the diff for secrets and unintended behavior.
6. Deploy only after validation.

## Cloudflare Issues automation
Issues may send diagnostic context to a coding agent. The agent should inspect this playbook and the connected repository, propose/test a fix, and leave deployment for review.
