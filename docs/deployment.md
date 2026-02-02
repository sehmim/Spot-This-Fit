# SpotThisFit — Deployment Guide

## Architecture

```
                    ┌──────────────────────────┐
  Browser ────────► │     Vercel               │
                    │     Next.js Frontend     │
                    │     (static + SSR)       │
                    └────────────┬─────────────┘
                                 │
                          /api/* │  (Next.js rewrites)
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │     Railway              │
                    │     Express Backend      │
                    │     (AI + SSE + APIs)    │
                    └──────────────────────────┘
```

- **Vercel** serves the Next.js frontend. Static pages are cached at the edge.
- **Railway** runs the Express backend for AI vision (GPT-4V), product enrichment (affiliate.com), and SSE streaming.
- The frontend proxies all `/api/*` requests to the backend via Next.js [rewrites](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites), so the browser only talks to the Vercel domain. This eliminates CORS issues and keeps the backend URL private.

---

## Prerequisites

- GitHub repository with the monorepo pushed
- [Vercel](https://vercel.com) account
- [Railway](https://railway.app) account
- OpenAI API key (for GPT-4V vision)
- (Optional) Affiliate.com API credentials

---

## 1. Deploy Backend to Railway

### Setup

1. Go to [railway.app](https://railway.app) and create a **New Project > Deploy from GitHub Repo**
2. Select your repository
3. Railway will create a service — in the service settings:
   - Set **Root Directory** to `/` (the repo root, not `/backend`)
   - Set **Config File Path** to `backend/railway.toml`
   - Railway will use `nixpacks` as the builder

### Environment Variables

Add these in the Railway dashboard (Variables tab):

| Variable                      | Required | Description                                  |
| ----------------------------- | -------- | -------------------------------------------- |
| `PORT`                        | Auto     | Railway sets this automatically               |
| `OPENAI_API_KEY`              | Yes      | OpenAI API key for GPT-4V vision             |
| `PRODUCT_PROVIDER`            | No       | `affiliate_com` (default) or `amazon`        |
| `AFFILIATE_COM_API_URL`       | No       | `https://api.affiliate.com`                  |
| `AFFILIATE_COM_TOKEN`         | No       | Leave empty for mock mode                    |
| `AFFILIATE_COM_AFFILIATE_ID`  | No       | Your affiliate ID                            |
| `AFFILIATE_COM_SUB_ID`        | No       | Sub-ID for tracking                          |
| `AFFILIATE_COM_NETWORK_ID`    | No       | Network identifier                           |
| `CORS_ORIGIN`                 | Yes      | Your Vercel domain, e.g. `https://spotthisfit.vercel.app` |

### Build & Start

Railway reads `backend/railway.toml`:

```toml
[build]
builder = "nixpacks"
buildCommand = "pnpm --filter @spotthisfit/shared run build && pnpm --filter backend run build"

[deploy]
startCommand = "cd backend && node dist/index.js"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

After deploy, note your Railway URL (e.g. `https://spotthisfit-backend-production.up.railway.app`).

### Generate a Domain

In Railway service settings > Networking, generate a public domain or add a custom one. You'll need this URL for the Vercel setup.

---

## 2. Deploy Frontend to Vercel

### Setup

1. Go to [vercel.com](https://vercel.com) and import your GitHub repository
2. Vercel detects `vercel.json` at the repo root:

```json
{
  "framework": "nextjs",
  "installCommand": "pnpm install",
  "buildCommand": "pnpm --filter @spotthisfit/shared run build && pnpm --filter frontend run build",
  "outputDirectory": "frontend/.next"
}
```

### Environment Variables

Add in the Vercel dashboard (Settings > Environment Variables):

| Variable      | Required | Description                                       |
| ------------- | -------- | ------------------------------------------------- |
| `BACKEND_URL` | Yes      | Railway backend URL (e.g. `https://spotthisfit-backend-production.up.railway.app`) |

### How API Proxying Works

`frontend/next.config.ts` contains a rewrite rule:

```ts
rewrites: async () => {
  const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";
  return [
    { source: "/api/:path*", destination: `${backendUrl}/api/:path*` },
  ];
},
```

This means:
- Browser requests `https://yoursite.vercel.app/api/search/frame`
- Vercel rewrites it to `https://your-railway-url.up.railway.app/api/search/frame`
- The browser never sees the Railway URL

---

## 3. Local Development

No deployment config needed — everything runs locally:

```bash
# Install dependencies (from repo root)
pnpm install

# Start all services in parallel
pnpm dev

# Or start individually
pnpm dev:frontend    # http://localhost:3000
pnpm dev:backend     # http://localhost:4000
```

The frontend `next.config.ts` rewrites default to `http://localhost:4000` when `BACKEND_URL` is not set, so everything works out of the box.

### Backend `.env`

```env
OPENAI_API_KEY=sk-...
PRODUCT_PROVIDER=affiliate_com
AFFILIATE_COM_API_URL=https://api.affiliate.com
AFFILIATE_COM_TOKEN=
AFFILIATE_COM_AFFILIATE_ID=
AFFILIATE_COM_SUB_ID=
AFFILIATE_COM_NETWORK_ID=
```

When `AFFILIATE_COM_TOKEN` is empty, the affiliate.com provider runs in **mock mode** — generating realistic fake product listings with Unsplash images so the full UI flow works without API keys.

---

## 4. Custom Domain (Optional)

### Vercel

1. Go to your project Settings > Domains
2. Add your domain (e.g. `spotthis.fit`)
3. Update DNS records as instructed

### Railway

1. Go to your service Settings > Networking > Custom Domain
2. Add a subdomain (e.g. `api.spotthis.fit`) if you want a clean URL
3. Update `BACKEND_URL` in Vercel to match

### After adding domains

Update `CORS_ORIGIN` in Railway to include your production domain:

```
CORS_ORIGIN=https://spotthis.fit,https://www.spotthis.fit
```

---

## Troubleshooting

### SSE stream disconnects immediately

Vercel serverless functions have a **60-second timeout** (Pro plan) or **10-second timeout** (Hobby plan). The SSE rewrite proxies to Railway which has no such limit, but if your Vercel plan enforces function duration limits on rewrites, you may need to upgrade or configure the route as an Edge function.

### Build fails with TS2742 errors

The backend `tsconfig.json` has `declaration: false` to avoid pnpm deep path issues. If you re-enable it, you'll get errors like "The inferred type of 'app' cannot be named without a reference to .pnpm/...". Keep declarations off — the backend is an app, not a library.

### CORS errors in production

1. Verify `CORS_ORIGIN` in Railway includes your exact Vercel domain (including `https://`)
2. If using Next.js rewrites (recommended), CORS shouldn't matter since the browser only talks to Vercel. CORS is a fallback for direct backend access.

### Mock mode vs real mode

If `AFFILIATE_COM_TOKEN` is empty, the backend generates fake product data. Products will show Unsplash images and randomized prices. Set the token to switch to real API calls.
