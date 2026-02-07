-- Migration: create image embeddings table for FashionCLIP 512-dim vectors

CREATE TABLE IF NOT EXISTS awin_image_embeddings (
    aw_product_id   TEXT PRIMARY KEY,
    embedding       vector(512) NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cosine distance index for ANN search
CREATE INDEX IF NOT EXISTS idx_awin_image_embeddings_cosine
  ON awin_image_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
