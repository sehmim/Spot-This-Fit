-- Migration: enable pgvector and create embeddings table

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS awin_product_embeddings (
    aw_product_id   TEXT PRIMARY KEY,
    embedding       vector(1536) NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cosine distance index for ANN search
CREATE INDEX IF NOT EXISTS idx_awin_product_embeddings_cosine
  ON awin_product_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
