# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cloudflare Workers webhook service for SpotThisFit. Receives Instagram DMs containing reels/posts, analyzes content for AI detection or screenshots it to find similar products, and replies via DM.

## Commands

- `npm run dev` — Local dev server via Wrangler
- `npm run deploy` — Deploy to Cloudflare Workers
- `npm run build` — Dry-run deploy (validation only)
- `npm run typecheck` — TypeScript type checking (`tsc --noEmit`)

No test runner or linter is configured.

## Secrets Management

`VERIFY_TOKEN` is in `wrangler.toml`. The following must be set via `wrangler secret put <NAME>`:
- `APP_SECRET` — Meta webhook signature verification
- `PAGE_ACCESS_TOKEN` — Instagram Graph API auth
- `SIGHTENGINE_API_USER` / `SIGHTENGINE_API_SECRET` — AI detection video analysis
- `OPENAI_API_KEY` — GPT-4o summarization of AI detection results

KV namespace `RATE_LIMIT_KV` is bound in `wrangler.toml` for per-user daily rate limiting.

## Architecture

Single-file app (`src/index.ts`) on Cloudflare Workers with two entry points:

1. **`fetch` handler** — Receives Instagram webhooks. GET requests handle Meta's verification challenge. POST requests validate the HMAC-SHA256 signature, extract reel/post URLs from message attachments or text, check per-user rate limits (5/day via KV), and enqueue to a Cloudflare Queue (`spotthisfit-processing`). Returns 200 immediately.

2. **`queue` handler** — Consumes from the queue (batch size 1, max 2 retries). Routes to one of two processing modes based on `QueueMessage.mode`:
   - **`ai_detect`** (default) — Fetches video from IG CDN, uploads to Sightengine for frame-by-frame AI detection, summarizes results via GPT-4o, replies with a detection report.
   - **`products`** — Screenshots the content (7 frames via `instag-playwright`), vectorizes all frames in parallel via `vertorize-img` (top 15 similar products per frame), replies with a "Shop Now" button linking to `spotthis.fit/results`.

### Feature Toggles

`ENABLE_PRODUCTS` (boolean constant at top of `src/index.ts`) controls whether users see a choice between AI detection and product spotting. When `false` (current default), all messages go straight to `ai_detect` mode.

## External Services

| Service | URL Pattern | Purpose |
|---------|------------|---------|
| Screenshot API | `instag-playwright.shadidhaque2014.workers.dev` | Captures frames from Instagram reels/posts |
| Vectorize API | `vertorize-img-get-similar-products.shadidhaque2014.workers.dev` | Image similarity search for products |
| Sightengine | `api.sightengine.com/1.0/video/check-sync.json` | AI-generated content detection on video |
| OpenAI API | `api.openai.com/v1/chat/completions` | GPT-4o summarization of AI detection results |
| Instagram Graph API | `graph.instagram.com/v22.0/me/messages` | Send DM replies |
| Results frontend | `www.spotthis.fit/results` | Shopping results page |
