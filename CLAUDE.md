# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is SpotThisFit?

AI-powered fashion finder that identifies clothing in photos/videos and shows users where to buy it. Also provides AI-generated content detection for Instagram reels.

## Monorepo Structure

pnpm workspace monorepo with these packages:

- **frontend/** — Next.js 16 (App Router, React 19, Tailwind 4, Zustand 5). Deployed on Vercel.
- **shared/** — TypeScript types, constants, validators. Must be built before frontend/backend (`pnpm --filter @spotthisfit/shared run build`).
- **webhook/** — Cloudflare Worker receiving Instagram DMs, routes to AI detection or product spotting. Has its own `CLAUDE.md`.
- **instag-image/** — Cloudflare Worker that captures video frames from Instagram posts via Playwright. Has its own `CLAUDE.md`.
- **vertorize-img/** — Cloudflare Workers (5 total) for CLIP-based image similarity search using Vectorize + D1. Has its own `CLAUDE.md`.

Note: `backend/` (Express, GPT-4V, SSE streaming) is referenced in workspace config and docs but may not be present locally — it runs on Railway in production.

## Commands

```bash
# Install
pnpm install

# Dev (all packages in parallel)
pnpm dev

# Dev individual packages
pnpm dev:frontend          # Next.js on http://localhost:3000
pnpm dev:backend           # Express on http://localhost:4000

# Build all
pnpm build

# Lint & typecheck all
pnpm lint
pnpm typecheck

# Cloudflare Workers (run from their directories)
cd webhook && npx wrangler dev
cd instag-image && npx wrangler dev
cd vertorize-img && npm run dev

# Tests (only vertorize-img has tests)
cd vertorize-img && npm test
```

## Architecture

### Data Flow (Web App)

1. User uploads photo on `/search`
2. Frontend sends base64 image to `POST /api/search/frame`
3. Next.js rewrites proxy `/api/*` to Express backend (configured in `frontend/next.config.ts`)
4. Backend calls OpenAI GPT-4V to identify clothing items
5. Frontend opens SSE stream to `GET /api/search/:id/stream`
6. Backend enriches products via pluggable provider (CJ Product Feed / affiliate.com / Amazon, controlled by `PRODUCT_PROVIDER` env var)
7. Products stream to frontend one at a time via Server-Sent Events

### Data Flow (Instagram Bot)

Instagram DM → webhook (Cloudflare Queue) → either:
- **AI detect mode**: Sightengine video analysis → GPT-4o summary → DM reply
- **Products mode**: instag-image (screenshot frames) → vertorize-img (CLIP similarity search) → DM reply with Shop Now link

### Frontend State

Three Zustand stores: `search-store` (input/frame/highlight), `results-store` (streamed products), `ui-store` (modals/flags).

### Frontend UI

shadcn/ui (new-york style) with Radix primitives, Lucide icons, Framer Motion animations. CSS path: `src/app/globals.css`. Import aliases: `@/components`, `@/lib`, `@/hooks`, `@/stores`.

### i18n

Two locales (EN/FR) in `frontend/src/locales/`. Server components use `createTranslator(locale)`, client components use `useTranslations()` hook. Locale stored in `stf_locale` cookie.

## Infrastructure

- **Database**: PostgreSQL 16 with pgvector (`docker-compose.yml`) for local dev
- **Cloudflare**: Workers, Vectorize (CLIP embeddings), D1 (product metadata), R2 (screenshots), KV (rate limiting), Queues
- **Node version**: 20 (`.nvmrc`)

## Mock Mode

The app runs fully without API keys. Missing `OPENAI_API_KEY` → mock product identification. Missing `AFFILIATE_COM_TOKEN` → fake product listings with Unsplash images. No setup needed for `pnpm dev`.

## Deployment

- Frontend: Vercel (config in `frontend/vercel.json`)
- Backend: Railway (config in `backend/railway.toml`). Build: shared first, then backend.
- Workers: `wrangler deploy` from each worker directory. vertorize-img has multiple workers with separate wrangler configs (`--config wrangler.*.jsonc`).
