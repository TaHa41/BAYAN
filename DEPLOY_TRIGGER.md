# BAYAN deployment trigger

Production deployment is triggered automatically after a successful **BAYAN CI** run on `main`.

The deployment workflow:
1. validates Cloudflare credentials,
2. applies remote D1 migrations,
3. deploys the Worker with the current BAYAN version and commit SHA,
4. runs production smoke tests,
5. runs the AI capability benchmark.

The Guardian workflow then performs scheduled production diagnostics and creates an incident when a verified regression is detected.

This file is documentation only; it does not contain credentials or deployment secrets.
