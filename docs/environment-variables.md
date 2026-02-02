# SpotThisFit — Environment Variables

## Backend

Set these in `backend/.env` (local) or in the Railway dashboard (production).

| Variable                      | Required | Default                      | Description                                              |
| ----------------------------- | -------- | ---------------------------- | -------------------------------------------------------- |
| `PORT`                        | No       | `4000`                       | Express server port. Railway sets this automatically.    |
| `OPENAI_API_KEY`              | Yes      | —                            | OpenAI API key for GPT-4V image analysis. Without it, the backend falls back to mock product data. |
| `PRODUCT_PROVIDER`            | No       | `affiliate_com`              | Which product enrichment provider to use. Options: `affiliate_com`, `amazon`. |
| `CORS_ORIGIN`                 | No       | `http://localhost:3000`      | Comma-separated list of allowed origins. Set to your Vercel domain in production. |
| `AFFILIATE_COM_API_URL`       | No       | —                            | Affiliate.com API base URL (e.g. `https://api.affiliate.com`). |
| `AFFILIATE_COM_TOKEN`         | No       | —                            | Bearer token for affiliate.com. **When empty, mock mode is active** — fake product data is generated. |
| `AFFILIATE_COM_AFFILIATE_ID`  | No       | —                            | Your affiliate ID for commission URL generation.         |
| `AFFILIATE_COM_SUB_ID`        | No       | —                            | Sub-ID for click tracking.                               |
| `AFFILIATE_COM_NETWORK_ID`    | No       | —                            | Network credential ID sent with API requests.            |
| `AMAZON_ASSOCIATE_TAG`        | No       | —                            | Amazon Associates tag (only used when `PRODUCT_PROVIDER=amazon`). |

## Frontend

Set these in `frontend/.env.local` (local) or in the Vercel dashboard (production).

| Variable      | Required | Default                  | Description                                                  |
| ------------- | -------- | ------------------------ | ------------------------------------------------------------ |
| `BACKEND_URL` | No       | `http://localhost:4000`  | Backend URL for Next.js rewrites. Set to your Railway URL in production (e.g. `https://your-app.up.railway.app`). This is a **server-side** variable — never exposed to the browser. |

## Mock Mode

The app is designed to run fully without external API keys:

- **No `OPENAI_API_KEY`**: Backend logs a warning and uses mock product identification data.
- **No `AFFILIATE_COM_TOKEN`**: Affiliate.com provider generates fake product listings with Unsplash images, randomized prices (CAD), and mock merchants (Nordstrom, Zara, Nike, etc.).

This means you can run `pnpm dev` and test the entire flow immediately without any API configuration.
