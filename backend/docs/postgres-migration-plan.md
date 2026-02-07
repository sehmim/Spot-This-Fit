# SpotThisFit Backend — Database Setup

## Prerequisites

- Node.js 22+
- pnpm
- PostgreSQL 14+ (via Homebrew or Docker)

## Quick Start

### Option A: Homebrew Postgres (macOS)

```bash
# 1. Install & start Postgres
brew install postgresql@14
brew services start postgresql@14

# 2. Create database and user
psql -d postgres -c "CREATE USER spotthisfit WITH PASSWORD 'spotthisfit';"
psql -d postgres -c "CREATE DATABASE spotthisfit OWNER spotthisfit;"
psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE spotthisfit TO spotthisfit;"

# 3. Add DATABASE_URL to backend/.env
# DATABASE_URL=postgres://spotthisfit:spotthisfit@localhost:5432/spotthisfit

# 4. Run migration
pnpm --filter backend run db:migrate

# 5. Import the Awin CSV feed
pnpm --filter backend run import-csv ./backend/datafeed_2754398.csv

# 6. Start the server
pnpm --filter backend run dev
```

### Option B: Docker

```bash
# 1. Start Postgres container (uses docker-compose.yml at project root)
docker compose up -d

# 2. Add DATABASE_URL to backend/.env (same credentials as docker-compose.yml)
# DATABASE_URL=postgres://spotthisfit:spotthisfit@localhost:5432/spotthisfit

# 3. Run migration
pnpm --filter backend run db:migrate

# 4. Import the Awin CSV feed
pnpm --filter backend run import-csv ./backend/datafeed_2754398.csv

# 5. Start the server
pnpm --filter backend run dev
```

## Environment Variables

Add to `backend/.env`:

```bash
DATABASE_URL=postgres://spotthisfit:spotthisfit@localhost:5432/spotthisfit
OPENAI_API_KEY=your-key
# Optional: OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

When `DATABASE_URL` is set, the app uses PostgreSQL for product search. Without it, Awin runs in mock mode.

## NPM Scripts

| Script | Command | Description |
|---|---|---|
| `db:migrate` | `pnpm --filter backend run db:migrate` | Run database migrations |
| `import-csv` | `pnpm --filter backend run import-csv <path>` | Import Awin CSV into database |
| `build-embeddings` | `pnpm --filter backend run build-embeddings` | Build pgvector embeddings for Awin catalog |
| `dev` | `pnpm --filter backend run dev` | Start dev server |

## Weekly CSV Refresh

When you download a new Awin feed CSV:

```bash
# Local database
pnpm --filter backend run import-csv ~/Downloads/datafeed_new.csv

# Railway database (provide the Railway DATABASE_URL)
DATABASE_URL="postgres://user:pass@host:port/db" pnpm --filter backend run import-csv ~/Downloads/datafeed_new.csv
```

The import uses a **staging table + atomic swap**, so the app continues serving results during the import with zero downtime. Old data is replaced once the import completes.

## Railway Deployment

1. Add a **PostgreSQL** service in the Railway dashboard
2. Railway auto-provides `DATABASE_URL` to the backend service
3. Deploy — migrations run automatically via the start command
4. Run the CSV import once against Railway's Postgres (use the public URL)

## Architecture

### Database Schema

Single `awin_products` table with 26 product columns + 2 generated columns:

- **`search_vector`** (TSVECTOR, STORED) — Weighted full-text index:
  - A = `product_name` (highest priority)
  - B = `brand_name`
  - C = `colour`
  - D = `description`, `category_name`, `keywords`, `fashion_material`
- **`is_in_stock`** (BOOLEAN, STORED) — Computed from `in_stock` and `stock_status`

### Indexes

- **GIN index** on `search_vector` for fast full-text search
- **B-tree** on `aw_product_id`, `search_price`, `is_in_stock`

### Search Scoring

PostgreSQL `ts_rank` with custom weights `{D=0.1, C=0.3, B=0.4, A=0.2}` approximates the original scoring priority: brand > colour > name > description. An additional +5 bonus is applied for exact phrase matches in product name, and +0.5 for in-stock items.

### Key Files

| File | Purpose |
|---|---|
| `src/db/connection.ts` | Database connection singleton |
| `src/db/migrations/*.sql` | Schema migrations |
| `src/scripts/migrate.ts` | Migration runner |
| `src/scripts/import-csv.ts` | CSV importer (staging table + atomic swap) |
| `src/services/providers/awin-product-store.ts` | Postgres-backed product search |
| `src/services/providers/awin.ts` | Awin provider (uses store or mock mode) |
| `docker-compose.yml` | Local Postgres container (project root) |

## Troubleshooting

**"DATABASE_URL not set"** — Add `DATABASE_URL` to `backend/.env`

**"awin_products table not found"** — Run `pnpm --filter backend run db:migrate`

**Search returns empty results** — Import the CSV: `pnpm --filter backend run import-csv ./backend/datafeed_2754398.csv`

**Connection refused on port 5432** — Start Postgres: `brew services start postgresql@14` or `docker compose up -d`

**Vector search missing** — Run `pnpm --filter backend run build-embeddings` after importing the CSV. This populates `awin_product_embeddings` for semantic search.
