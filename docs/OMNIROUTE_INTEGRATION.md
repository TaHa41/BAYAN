# OmniRoute integration for BAYAN

BAYAN can optionally send AI drafting and evidence-grounded answers to an independently hosted OmniRoute instance through its OpenAI-compatible Chat Completions API. This is an optional fallback; existing Gemini, OpenAI, and Workers AI behavior remains in place.

## Free-hosting reality

OmniRoute's self-host guide recommends about 2 GB of free RAM and Docker Compose. Free web services such as Render sleep after 15 minutes idle, have ephemeral filesystems, and may have too little memory for OmniRoute. Therefore this integration does not claim that a reliable always-on production host is available at zero cost. Check the provider's current resource and billing limits. Do not add a payment method if a hard zero-spend setup is required.

## Configure BAYAN

Set these as Cloudflare Worker secrets/variables, never in committed files:

- OMNIROUTE_BASE_URL: HTTPS origin or API base URL, such as https://your-service.example or https://your-service.example/v1.
- OMNIROUTE_API_KEY: the API key configured in OmniRoute. Never commit it or expose it in browser code.
- OMNIROUTE_MODEL: optional model/router name accepted by the OmniRoute instance; defaults to auto.

The Worker sends requests to /v1/chat/completions (or /chat/completions when the configured base path already ends in /v1). Remote HTTP endpoints are rejected; use HTTPS. Test OmniRoute /healthz and authenticated API before enabling the Worker variables.

Example commands, run locally from the BAYAN repository after confirming the selected Cloudflare account and Worker:

    npx wrangler secret put OMNIROUTE_API_KEY
    npx wrangler secret put OMNIROUTE_BASE_URL
    npx wrangler secret put OMNIROUTE_MODEL

Store the API key only as a secret. These commands configure the currently selected Cloudflare account.

## Evidence and failure handling

OmniRoute is a text-generation fallback, not an evidence source. BAYAN still supplies retrieved excerpts and runs its existing sentence-level source-ID checks, unsupported-specifics checks, language checks, and independent-publisher requirements before an article can be marked verified. An OmniRoute response alone must never cause an article to be published.

## Deployment and verification

This change adds optional integration code only. It does not deploy OmniRoute, create an external hosting account, set Cloudflare secrets, or prove a live end-to-end request. Complete those account-dependent steps, then run CI and a smoke test with a real secured endpoint.
