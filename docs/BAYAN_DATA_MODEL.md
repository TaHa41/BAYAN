# BAYAN v1 Data Model

articles: published bilingual editorial content and source evidence.
contributions: public submissions awaiting review or already approved/rejected.
searches: private query telemetry used for diagnostics and product improvement.
saved_articles: visitor-scoped saved slugs without collecting a name or email.
analytics: private aggregateable traffic events; no public analytics endpoint.
runtime_events: health and operational events.
repair_jobs: bounded self-healing state and audit trail.

No table may be silently altered. Schema changes are additive migrations only.