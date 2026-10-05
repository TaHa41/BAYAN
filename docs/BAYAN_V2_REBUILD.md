# BAYAN v2 rebuild
This branch is a clean runtime rewrite. The old release is treated as a diagnostic prototype, not a code base to patch.
## Non-negotiable rules
- Provider failure must never fail article publication.
- Image resolution is optional and isolated.
- AI is an enhancement after retrieval, never the only source of truth.
- English UI must not silently fall back to Arabic.
- Manager endpoints require BAYAN_AI_MANAGER_TOKEN.
- Telegram is the owner notification channel; no Resend dependency.
- Visitor contributions remain pending until review.
- Production changes are merged only after CI and smoke verification.
## Layers
core -> HTTP/security primitives; db -> persistence; news/images/live -> isolated providers; ai -> evidence-aware generation; routes -> API boundary; index -> request/schedule orchestration; public -> client UI.
