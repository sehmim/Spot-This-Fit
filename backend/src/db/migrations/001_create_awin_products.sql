-- Migration: Create awin_products table with full-text search

-- Track applied migrations
CREATE TABLE IF NOT EXISTS _migrations (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Main product table
CREATE TABLE IF NOT EXISTS awin_products (
    id                          SERIAL PRIMARY KEY,
    aw_product_id               TEXT NOT NULL,
    product_name                TEXT NOT NULL DEFAULT '',
    brand_name                  TEXT DEFAULT '',
    aw_image_url                TEXT DEFAULT '',
    merchant_image_url          TEXT DEFAULT '',
    large_image                 TEXT DEFAULT '',
    search_price                NUMERIC(10,2) DEFAULT 0,
    rrp_price                   NUMERIC(10,2),
    savings_percent             NUMERIC(5,2),
    currency                    TEXT DEFAULT 'USD',
    aw_deep_link                TEXT DEFAULT '',
    merchant_deep_link          TEXT DEFAULT '',
    merchant_name               TEXT DEFAULT '',
    description                 TEXT DEFAULT '',
    product_short_description   TEXT DEFAULT '',
    category_name               TEXT DEFAULT '',
    merchant_category           TEXT DEFAULT '',
    product_type                TEXT DEFAULT '',
    colour                      TEXT DEFAULT '',
    in_stock                    TEXT DEFAULT '',
    stock_status                TEXT DEFAULT '',
    keywords                    TEXT DEFAULT '',
    fashion_material            TEXT DEFAULT '',
    fashion_size                TEXT DEFAULT '',
    product_model               TEXT DEFAULT '',
    model_number                TEXT DEFAULT '',

    -- Generated weighted tsvector for full-text search
    -- A = product_name (highest), B = brand_name, C = colour, D = everything else
    search_vector               TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(product_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(brand_name, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(colour, '')), 'C') ||
        setweight(to_tsvector('english',
            COALESCE(description, '') || ' ' ||
            COALESCE(category_name, '') || ' ' ||
            COALESCE(keywords, '') || ' ' ||
            COALESCE(fashion_material, '')
        ), 'D')
    ) STORED,

    -- Computed boolean for in-stock filtering
    is_in_stock                 BOOLEAN GENERATED ALWAYS AS (
        in_stock = '1' OR stock_status = 'in stock'
    ) STORED,

    imported_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_awin_products_search ON awin_products USING GIN (search_vector);

-- B-tree index on aw_product_id
CREATE INDEX IF NOT EXISTS idx_awin_products_aw_id ON awin_products (aw_product_id);

-- Partial index for in-stock products
CREATE INDEX IF NOT EXISTS idx_awin_products_in_stock ON awin_products (is_in_stock) WHERE is_in_stock = true;

-- Index on search_price for sort tiebreaker
CREATE INDEX IF NOT EXISTS idx_awin_products_price ON awin_products (search_price);
