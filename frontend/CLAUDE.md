# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev server (from monorepo root or frontend/)
pnpm dev:frontend          # http://localhost:3000
cd frontend && pnpm dev    # same, from this directory

# Build / type-check / lint
pnpm build
pnpm typecheck             # tsc --noEmit
pnpm lint                  # eslint
```

No tests exist in this package.

## Route Structure

The app uses Next.js App Router. Pages are under `src/app/`:

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/search` | Enter Instagram/video URL |
| `/search/preview` | Loading screen while frames are extracted + vectorized |
| `/search/frame` | (legacy) Manual frame selector from downloaded video |
| `/search/highlight` | (legacy) Draw a highlight region on the frame |
| `/results` | Product grid with SSE stream or direct Vectorize results |
| `/blog`, `/guides/*` | SEO content |
| `/admin` | Internal admin page |

## Key Data Flows

### Video search flow (primary)
1. User pastes video URL on `/search` → stored in `search-store.videoPreviewUrl`
2. `/search/preview` page calls `useVideoFrames` → POSTs to `instag-playwright` Cloudflare Worker → returns R2 image URLs + `runId` + `keys`
3. Firestore (`videoSearches` collection) is checked first; frames are cached there after the first fetch
4. Middle frame is auto-selected → `useImageSearch.searchByUrl()` → POSTs to `vertorize-img-get-similar-products` Worker
5. On success, products are stored in `results-store` → navigate to `/results?id=<runId>&keys=<...>`
6. `/results` page: if arriving via `?id=` param, tries D1 cache via `vertorize-img-results` Worker first; falls back to live vectorization

### SSE streaming flow (backend path, less common)
- Used when `search-store.searchId` is set (Express backend path)
- `useProductStream` opens `EventSource` to `/api/search/:id/stream`
- Backend proxied via Next.js rewrites: `/api/*` → `BACKEND_URL/api/*` (see `next.config.ts`)

## Zustand Stores

All stores are in `src/stores/`. Selectors should be granular (`s => s.field`) to avoid unnecessary re-renders.

- **`search-store`** — Input URL, selected frame (base64 or URL), highlight region, video frames array, `searchId` (backend flow), `searchDocId` (Firestore), `searchMode` (`"image" | "video"`)
- **`results-store`** — Streamed products array, streaming state, `selectedProduct` (opens drawer). `setProducts()` marks stream as complete instantly (used for Vectorize path).
- **`ui-store`** — Email capture sheet open/submitted flags
- **`currency-store`** — Selected display currency (USD/CAD/GBP/EUR), exchange rates fetched from `api.frankfurter.app`, cached 1 hour in `localStorage` (`stf_currency` key). Use `convert(amount, fromCurrency)` to convert prices.

## i18n Pattern

Two locales: `en` (default), `fr`. Locale stored in `stf_locale` cookie.

- **Server components**: `const locale = await getLocaleFromCookies(); const t = createTranslator(locale);`
- **Client components**: `const t = useTranslations();` (from `@/components/i18n/locale-provider`)
- Translation keys are flat (`"results.searchStatus.analyzingImage"`) and typed via `TranslationKey`. Add new keys to both `src/locales/en.json` and `src/locales/fr.json`.
- Template params use `{placeholder}` syntax: `t("key", { count: 5 })`

## External Workers (hardcoded URLs)

These Cloudflare Worker URLs are referenced directly in frontend code:

| Constant | Location | Purpose |
|---|---|---|
| `WORKER_URL` | `use-video-frames.ts` | `instag-playwright` — extracts frames from video URLs |
| `VECTORIZE_URL` | `use-image-search.ts` | `vertorize-img-get-similar-products` — CLIP similarity search |
| `RESULTS_WORKER` | `results/page.tsx` | `vertorize-img-results` — fetches D1-cached results by runId |
| `SCREENSHOT_WORKER` | `results/page.tsx` | `instag-playwright` — serves R2 images by key |

## Firebase / Firestore

`src/lib/firebase.ts` initializes with `NEXT_PUBLIC_FIREBASE_*` env vars. `src/lib/video-search-db.ts` handles the `videoSearches` collection — stores `{ videoUrl, frames[], createdAt }` documents. Used to cache frames for shared links (`/results?q=<docId>`).

## Component Conventions

- UI primitives live in `src/components/ui/` (shadcn/ui, new-york style — do not edit these manually, use the shadcn CLI)
- Feature components organized by domain: `layout/`, `search/`, `results/`, `landing/`, `i18n/`
- Use `cn()` from `@/lib/utils` (clsx + tailwind-merge) for conditional class names
- `PageTransition` wraps page-level components for Framer Motion fade transitions
- `ApiClientError` from `@/lib/api-client` carries `.code` and `.status` — use `isApiClientError()` guard for typed error handling

## Environment Variables

```
BACKEND_URL                        # Express backend URL (defaults to http://localhost:4000)
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

App works without any env vars set — Vectorize path is always available without keys; backend SSE path is skipped unless `searchId` is set.
