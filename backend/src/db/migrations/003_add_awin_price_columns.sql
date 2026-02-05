-- Migration: add store_price and display_price to awin_products

ALTER TABLE awin_products
  ADD COLUMN IF NOT EXISTS store_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS display_price TEXT;
