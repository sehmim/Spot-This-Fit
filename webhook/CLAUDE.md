# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cloudflare Workers webhook service for SpotThisFit. Receives Instagram DMs containing reels/posts, screenshots the content, vectorizes the images to find similar products, and replies with a shopping link.

## Commands

- `npm run dev` — Local dev server via Wrangler
- `npm run deploy` — Deploy to Cloudflare Workers
- `npm run build` — Dry-run deploy (validation only)
- `npm run typecheck` — TypeScript type checking (`tsc --noEmit`)

No test runner or linter is configured.

## Secrets Management

`VERIFY_TOKEN` is in `wrangler.toml`. `APP_SECRET` and `PAGE_ACCESS_TOKEN` must be set via `wrangler secret put <NAME>`.

## Architecture

Single-file app (`src/index.ts`) on Cloudflare Workers with two entry points:

1. **`fetch` handler** — Receives Instagram webhooks. GET requests handle Meta's verification challenge. POST requests validate the HMAC-SHA256 signature, extract reel/post URLs from message attachments or text, and enqueue them to a Cloudflare Queue (`spotthisfit-processing`). Returns 200 immediately without waiting for processing.

2. **`queue` handler** — Consumes from the queue (batch size 1, max 2 retries). For each message, runs `processAndReply`:
   - Sends acknowledgement DM to user
   - Calls screenshot API (`instag-playwright` worker) to capture 6 frames
   - Vectorizes all frames in parallel via `vertorize-img` worker (top 15 similar products per frame)
   - Sends "Shop Now" button reply linking to `spotthis.fit/results`

## External Services

| Service | URL Pattern | Purpose |
|---------|------------|---------|
| Screenshot API | `instag-playwright.shadidhaque2014.workers.dev` | Captures frames from Instagram reels/posts |
| Vectorize API | `vertorize-img-get-similar-products.shadidhaque2014.workers.dev` | Image similarity search for products |
| Instagram Graph API | `graph.instagram.com/v22.0/me/messages` | Send DM replies |
| Results frontend | `www.spotthis.fit/results` | Shopping results page |
