# BAYAN Product Contract — Protected Requirements

This file is the canonical product contract for BAYAN. Changes to core features must update this document and the automated product guards together.

## Visitor experience
- Arabic and English are first-class languages; English routes must not leave Arabic navigation labels.
- Homepage search carries the entered query directly into the search route.
- Search supports questions, people, topics, news, prices, weather, how-to and troubleshooting.
- Answers are evidence-first, separate the answer from sources, and never invent evidence.
- Search uses multiple providers when available and reports evidence coverage honestly.
- News is separate from trends/interest and must not publish unverified material.
- News articles can include verified source/time/image metadata.
- Prices/live data remain available through provider fallbacks and bounded requests.
- Tools page activates maps and image discovery.
- Saved articles/research remain available.
- Visitor contributions go through review before publication.

## Management
- Management is protected by BAYAN_AI_MANAGER_TOKEN.
- AI repair can diagnose and propose/perform bounded repairs without weakening auth, evidence verification, moderation, CSP/rate limits or deleting data.
- Content and article image controls are available.
- Contribution review is available.
- Repair queue and verification state are available.
- Telegram is the operational notification channel; Resend is not a required runtime dependency.
- Private analytics are manager-only.

## Reliability
- Cloudflare AI and OpenAI use fallback/cooldown handling.
- AI Search uses hybrid retrieval and relevance/reranking where supported.
- External live providers have timeouts.
- Production smoke diagnostics and Guardian/self-healing remain wired.
- D1 schema changes are versioned and legacy columns are reconciled safely.
- Frontend JavaScript syntax and product contracts are checked before release.
- No core route may call an undefined renderer.

## Preservation rule
A future edit must not remove a listed requirement silently. If a requirement intentionally changes, update this contract, the corresponding implementation, and the automated guard in the same change.
