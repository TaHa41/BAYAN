# BAYAN Engineering Playbook

## Mission
Keep BAYAN evidence-first, resilient, and operational. Prefer safe automatic recovery over silent failure.

## Rules
- Never expose API keys, manager tokens, authorization headers, or other secrets in logs, emails, UI, commits, or issues.
- Never publish unsupported or single-source claims as verified facts.
- Search/news answers should prefer independent sources and label limited evidence.
- Visitor contributions remain PENDING_REVIEW until a manager verifies them.
- Verified contributions may enter the knowledge database only after the review action succeeds.
- Technical failures must be observable through console errors/Cloudflare Issues and sent to the configured Telegram owner channel.
- AI failures should use the configured fallback chain before returning Insufficient Evidence.
- The runtime AI may attempt safe operational recovery first: retry, fallback provider, temporary provider cooldown, or alternate search source. It must not edit source code, secrets, permissions, or production data autonomously.

## Repair loop
1. Reproduce the failure from logs/Issues.
2. Identify the smallest safe code/config change.
3. Add or update a regression test when practical.
4. Run typecheck, tests, and Wrangler dry-run.
5. Review the diff for secrets and unintended behavior.
6. Deploy only after validation.

## Runtime self-healing\n1. Detect and reproduce the failure.\n2. Ask the configured AI for a diagnosis and a safe recovery proposal.\n3. Execute only allowlisted operational actions.\n4. Re-test the affected path.\n5. Send the outcome to Telegram.\n6. If a source-code/configuration change is required, create a repair proposal for review rather than changing production code.\n\n## Cloudflare Issues automation
Issues may send diagnostic context to a coding agent. The agent should inspect this playbook and the connected repository, propose/test a fix, and leave deployment for review.
