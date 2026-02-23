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
- `SIGHTENGINE_CALLBACK_WINTER_SUMMER` — Shared secret for Sightengine async callbacks
- `OPENAI_API_KEY` — GPT-4o summarization of AI detection results
- `ADMIN_SECRET` — Guards the `GET /admin/conversations` endpoint

KV namespace `RATE_LIMIT_KV` is bound in `wrangler.toml` for per-user daily rate limiting (5/day; `RATE_LIMIT_WHITELIST` in `src/index.ts` bypasses this for specific sender IDs).

D1 database `CONVERSATIONS_DB` (bound as `vertorize-img-db`) stores conversation history, pending jobs, and analysis result cache.

## Architecture

Single-file app (`src/index.ts`) on Cloudflare Workers with two entry points:

### `fetch` handler — HTTP routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/*` (default) | Meta webhook verification challenge |
| GET | `/admin/conversations` | Admin API — returns messages from D1, filtered by `?secret=`, `?sender_id=`, `?limit=` |
| POST | `/sightengine-callback` | Receives async callbacks from Sightengine (guarded by `?secret=`) |
| POST | `/*` (default) | Instagram webhook — validates HMAC-SHA256 signature, processes DMs |

Webhook POST flow: validate signature → extract reel/post URL (from attachments or IG URL regex in text) → check D1 result cache (replay immediately if hit) → check KV rate limit → enqueue to `spotthisfit-processing` queue. If no URL found: reject direct file uploads with a help message, or handle plain text via GPT-4o conversational reply.

### `queue` handler — Async processing

Consumes from `spotthisfit-processing` (batch size 1, max 2 retries). Routes by `QueueMessage.mode`:
- **`ai_detect`** — Starts the two-phase Sightengine async analysis (see below)
- **`deepfake_retry`** — Re-submits the deepfake job after a 20s delay (handles error code 37 "stream slot busy")
- **`products`** — Screenshots (7 frames via `instag-playwright`), vectorizes in parallel, replies with "Shop Now" button

### Two-phase Sightengine async flow (ai_detect)

1. **`processAiDetection`** submits a `genai` model job to Sightengine's async API with a callback URL, stores a `PendingAiJob` in D1 (`phase: "genai"`).
2. **`/sightengine-callback?model=genai`** fires → sends genai mini-report DM, stores genai frames in D1, advances `phase` to `"deepfake"`, enqueues a `deepfake_retry` message with 20s delay.
3. **`submitDeepfakeJob`** submits a `deepfake` model job with its own callback URL. Throws on Sightengine error code 37 to trigger queue retry with backoff.
4. **`/sightengine-callback?model=deepfake`** fires → sends deepfake mini-report DM, calls GPT-4o for a combined summary DM (3rd message), persists all three report strings to `stf_analysis_results` cache, deletes the `PendingAiJob`.

Cached results (keyed by `content_url`) are replayed immediately in the `fetch` handler before the queue is involved, so repeat URLs never hit Sightengine or OpenAI again.

### Conversational reply

Plain-text DMs (no reel URL) are answered by GPT-4o with a strict system prompt (`SYSTEM_PROMPT` constant) that limits the bot to: guiding users to share a reel, answering clarification questions about the bot, and acknowledging feedback. The last 2 hours of conversation history from D1 is included as context.

### Feature Toggles

`ENABLE_PRODUCTS` (boolean constant at top of `src/index.ts`) controls whether users see a choice between AI detection and product spotting. When `false` (current default), all messages go straight to `ai_detect` mode.

## D1 Database Schema

Three tables in `CONVERSATIONS_DB` (migrations in `migrations/`):

- **`stf_messages`** — Full conversation history (`sender_id`, `role` ∈ {user, bot}, `content`, `created_at` unix seconds). Indexed on `(sender_id, created_at)`.
- **`stf_analysis_jobs`** — In-flight Sightengine jobs (`job_id` PK, `sender_id`, `content_url`, `phase` ∈ {genai, deepfake}, `genai_frames` JSON string).
- **`stf_analysis_results`** — Completed analysis cache (`content_url` PK, `genai_report`, `deepfake_report`, `summary`).

Apply migrations: `wrangler d1 migrations apply vertorize-img-db`

## External Services

| Service | URL Pattern | Purpose |
|---------|------------|---------|
| Screenshot API | `instag-playwright.shadidhaque2014.workers.dev` | Captures 7 frames from Instagram reels/posts |
| Vectorize API | `vertorize-img-get-similar-products.shadidhaque2014.workers.dev` | Image similarity search for products |
| Sightengine async | `api.sightengine.com/1.0/video/check.json` | AI-generated content and deepfake detection |
| OpenAI API | `api.openai.com/v1/chat/completions` | GPT-4o combined summary + conversational replies |
| Instagram Graph API | `graph.instagram.com/v22.0/me/messages` | Send DM replies |
| Results frontend | `www.spotthis.fit/results` | Shopping results page |
