# BAYAN V3 Build Contract

This branch is a clean rebuild, not a patch series.

Release gates:
1. Typecheck passes.
2. Frontend syntax passes.
3. Unit and integration tests pass.
4. D1 migration sequence is contiguous and schema-compatible.
5. Public APIs return stable contracts and never leak private diagnostics.
6. Arabic/English routes are complete and contamination-tested.
7. Evidence/publication gates require independent sources where verification is claimed.
8. Provider failure is isolated and cannot become fabricated success.
9. Admin actions require BAYAN_AI_MANAGER_TOKEN.
10. Telegram is the operational notification path; Resend is not required.
11. Production smoke covers every public section and critical API.
12. Cloudflare build and deployment pass on the exact commit being verified.
13. No merge to main until all gates pass.


CI contract verification: static guards, typecheck, unit tests, syntax checks, and Wrangler build must all pass before merge.
