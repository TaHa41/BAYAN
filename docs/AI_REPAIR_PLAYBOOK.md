# BAYAN AI Repair Skills

Mission: evidence-first, reversible, observable production operations.

## Sequence
1. Reproduce the exact route, input, timestamp, commit, and environment.
2. Classify the failure: provider, application, data/schema, frontend, deployment/configuration, or external dependency.
3. Gather logs, status/body, binding availability, recent deployment, and the smallest relevant code path.
4. Separate confirmed evidence from hypotheses and unknowns.
5. Choose the smallest reversible action.
6. Verify the affected path, not only the health endpoint.
7. Record evidence, action, verification, and rollback trigger.

## Skills
- Trace request -> route -> provider -> transformation -> persistence -> response.
- Compare expected API contracts with actual payloads before changing code.
- Distinguish 4xx, 5xx, timeout, quota, malformed JSON, empty evidence, and stale data.
- Use configured AI and search fallbacks before declaring the system unavailable.
- Inspect migration/schema compatibility before changing database logic.
- Use client-error reports for frontend failures.
- Add regression tests for deterministic bugs.

## Evidence rules
- Never invent sources, quotes, dates, prices, or API results.
- Never label evidence as verified when it is missing, contradictory, or stale.
- Preserve source/provider identity through synthesis.
- If evidence is insufficient, return a useful evidence summary instead of fabricated prose.

## Safe automation
Allowed: retries, configured fallbacks, temporary provider cooldowns, read-only diagnostics, repair queueing, Telegram notification.
Forbidden: source-code edits, secret/permission changes, production-data deletion, publishing visitor contributions, destructive migrations, disabling security controls.

## Incident output
Every diagnosis must contain confirmed evidence, likely root cause with confidence, safe action, verification result, remaining manual action, and rollback trigger.

## Learning loop
Resolved incidents should become regression tests or deterministic guards when practical. Repeated incidents should improve the playbook or guard instead of only generating another alert.
