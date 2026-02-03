# SpotThisFit — Architecture

## Overview

SpotThisFit is an AI-powered fashion finder that identifies clothing in photos and social media videos and shows users where to buy it. The app is built as a **pnpm monorepo** with three packages:

```
spotthisfit/
├── frontend/     # Next.js 16 (App Router, React 19, Tailwind 4)
├── backend/      # Express 4 (AI vision, product enrichment, SSE streaming)
├── shared/       # TypeScript types, constants, validators
├── videos/       # Static video assets (dev/demo)
├── vercel.json   # Vercel deployment config
└── docs/         # Documentation
```

---

## Tech Stack

| Layer       | Technology                                         |
| ----------- | -------------------------------------------------- |
| Frontend    | Next.js 16.1.6, React 19, Zustand 5, Tailwind 4   |
| Backend     | Express 4, OpenAI GPT-4V, SSE streaming            |
| Shared      | TypeScript 5, pnpm workspaces, project references   |
| UI          | Radix UI, shadcn/ui, Framer Motion, Lucide icons   |
| Deployment  | Vercel (frontend) + Railway (backend)               |
| i18n        | Custom translator (EN/FR), server-side locale       |

---

## Directory Structure

### Backend (`backend/src/`)

```
src/
├── index.ts                    # Entry point — starts Express on PORT (default 4000)
├── app.ts                      # Express app: CORS, JSON parsing, routes, error handler
├── controllers/
│   ├── search.controller.ts    # POST /api/search/frame — starts AI search
│   │                           # GET /api/search/:id/stream — SSE product stream
│   ├── download.controller.ts  # POST /api/video/download — mock video download
│   ├── video.controller.ts     # Video validation & metadata
│   └── user.controller.ts      # POST /api/user/email — email capture
├── routes/
│   ├── index.ts                # Mounts all sub-routers under /api
│   ├── search.routes.ts        # /api/search/*
│   ├── download.routes.ts      # /api/video/download
│   ├── video.routes.ts         # /api/video/*
│   └── user.routes.ts          # /api/user/*
├── middleware/
│   ├── error-handler.ts        # Catches errors, returns ApiError JSON
│   └── request-logger.ts       # Logs [timestamp] METHOD /path
├── services/
│   ├── vision.ts               # OpenAI GPT-4V image analysis
│   ├── product-enrichment.ts   # Provider factory (reads PRODUCT_PROVIDER env)
│   └── providers/
│       ├── types.ts            # ProductProvider interface
│       ├── cj-product-feed.ts  # CJ Product Feed GraphQL API
│       ├── affiliate-com.ts    # Affiliate.com API + mock mode
│       └── amazon.ts           # Amazon Associates provider
└── mock-data/                  # Fallback demo data
```

### Frontend (`frontend/src/`)

```
src/
├── app/
│   ├── layout.tsx              # Root layout (i18n provider, toaster)
│   ├── page.tsx                # Landing page (server component)
│   ├── search/
│   │   ├── layout.tsx          # Passthrough layout for nested routes
│   │   ├── page.tsx            # Photo upload + disabled video URL section
│   │   ├── frame/page.tsx      # Video frame selector (canvas capture)
│   │   └── highlight/page.tsx  # Draw bounding box + describe product
│   └── results/
│       └── page.tsx            # SSE streaming results + product drawer
├── components/
│   ├── landing/                # Landing page sections (hero, CTA, how-it-works)
│   ├── search/                 # Frame selector, highlighter, description input
│   ├── results/                # Product grid, carousel, drawer, email capture
│   ├── layout/                 # Header, page transitions
│   ├── i18n/                   # Locale provider
│   └── ui/                     # shadcn/ui primitives
├── hooks/
│   └── use-product-stream.ts   # SSE EventSource hook
├── stores/
│   ├── search-store.ts         # Search session state (Zustand)
│   ├── results-store.ts        # Streaming results state
│   └── ui-store.ts             # UI state (modals, flags)
├── lib/
│   ├── api-client.ts           # Fetch wrapper (relative URLs)
│   ├── i18n.ts                 # Translator factory, locale types
│   ├── i18n-server.ts          # Server-side locale from cookies
│   ├── error-messages.ts       # API error → i18n message mapping
│   └── utils.ts                # cn() classname helper
└── locales/
    ├── en.json                 # English translations
    └── fr.json                 # French translations
```

### Shared (`shared/src/`)

```
src/
├── index.ts                    # Barrel export
├── types/
│   ├── api.ts                  # ApiResponse<T>, ApiError, ApiResult<T>
│   ├── product.ts              # Product, ConfidenceLevel, ProductCategory
│   ├── search.ts               # SearchRequest, SSEEvent, FrameSearchRequest
│   ├── user.ts                 # EmailCaptureRequest/Response
│   └── video.ts                # VideoUrl, TimeRange, HighlightRegion, Platform
├── constants/
│   ├── platforms.ts            # SUPPORTED_PLATFORMS, URL_PATTERNS
│   └── processing.ts          # STATUS_MESSAGES, CONFIDENCE_THRESHOLDS
└── validators/
    └── url.ts                  # validateVideoUrl(), extractPlatform()
```

---

## Core Data Flow

```
┌─────────────┐     POST /api/search/frame      ┌──────────────────┐
│   Frontend   │ ──────────────────────────────► │     Backend      │
│  (Next.js)   │     {frameImage, highlight?,    │    (Express)     │
│              │      description?}               │                  │
│              │                                  │  1. analyzeFrame │
│              │                                  │     (GPT-4V)     │
│              │     GET /api/search/:id/stream   │                  │
│              │ ◄─────────────── SSE ──────────► │  2. enrichProducts│
│              │     event: status                │     (affiliate   │
│              │     event: product               │      .com API)   │
│              │     event: product               │                  │
│              │     event: complete              │  3. Stream each  │
│              │                                  │     product via  │
└─────────────┘                                  │     SSE          │
                                                 └──────────────────┘
```

1. User uploads a photo on `/search`
2. Frontend sends base64 image to `POST /api/search/frame`
3. Backend calls **OpenAI GPT-4V** to identify clothing items
4. Backend returns a `searchId`
5. Frontend navigates to `/results` and opens an **EventSource** to `GET /api/search/:id/stream`
6. Backend enriches each identified product via the **product provider** (CJ Product Feed, affiliate.com, or Amazon)
7. Products stream to the frontend one at a time via **Server-Sent Events**
8. Frontend renders products with spring animations as they arrive

---

## Product Provider System

The backend uses a pluggable provider pattern for product enrichment:

```
ProductProvider interface
├── CjProductFeedProvider  (default, reads CJ_AUTH_TOKEN + CJ_COMPANY_ID)
├── AffiliateComProvider   (reads AFFILIATE_COM_TOKEN)
│   ├── Real mode          (when token is set — calls POST /v1/products)
│   └── Mock mode          (when token is empty — generates fake listings)
└── AmazonProvider         (generates Amazon search URLs)
```

Switch providers via the `PRODUCT_PROVIDER` environment variable (`cj`, `affiliate_com`, or `amazon`).

The provider implements an `AsyncGenerator<Product>` so products yield one at a time, naturally feeding the SSE stream.

---

## State Management

Three Zustand stores on the frontend:

| Store          | Purpose                                      |
| -------------- | -------------------------------------------- |
| `search-store` | Input URL, downloaded video, selected frame, highlight region, description, searchId |
| `results-store`| Streamed products array, streaming status, selected product (for drawer) |
| `ui-store`     | Email sheet visibility, submission flag       |

---

## API Endpoints

| Method | Path                          | Description                              |
| ------ | ----------------------------- | ---------------------------------------- |
| POST   | `/api/video/download`         | Download video from URL (mock: 2s delay) |
| POST   | `/api/search/frame`           | Start search from frame image            |
| GET    | `/api/search/:id/stream`      | SSE stream of enriched products          |
| POST   | `/api/user/email`             | Save user email for results              |

---

## SSE Event Types

| Event      | Data                                           |
| ---------- | ---------------------------------------------- |
| `status`   | `{message, code, params?, retailersSearched}`  |
| `product`  | Full `Product` object                          |
| `complete` | `{totalProducts}`                              |
| `error`    | `{message}`                                    |

---

## Internationalization

- Two locales: `en` and `fr`
- Translation keys derived from `en.json` as TypeScript union type (`TranslationKey`)
- Server components use `createTranslator(locale)` directly
- Client components use `useTranslations()` hook via context
- Locale stored in cookie (`stf_locale`), detected server-side
