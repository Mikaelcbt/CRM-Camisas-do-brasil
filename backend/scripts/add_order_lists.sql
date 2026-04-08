-- ============================================================
-- Migration: Listas de Pedidos
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Order lists table
CREATE TABLE IF NOT EXISTS order_lists (
  id        BIGSERIAL PRIMARY KEY,
  name      TEXT NOT NULL,
  notes     TEXT,
  status    TEXT NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft', 'confirmed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. List entries (one per customer in the list)
CREATE TABLE IF NOT EXISTS list_entries (
  id            BIGSERIAL PRIMARY KEY,
  list_id       BIGINT NOT NULL REFERENCES order_lists(id) ON DELETE CASCADE,
  customer_id   BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  notes         TEXT,
  order_id      BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Products per entry
CREATE TABLE IF NOT EXISTS list_entry_products (
  id           BIGSERIAL PRIMARY KEY,
  entry_id     BIGINT NOT NULL REFERENCES list_entries(id) ON DELETE CASCADE,
  product_id   BIGINT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity     INT NOT NULL DEFAULT 1,
  unit_price   DECIMAL(10,2) NOT NULL
);

-- 4. Link orders back to the list they were confirmed from
ALTER TABLE orders ADD COLUMN IF NOT EXISTS list_id BIGINT REFERENCES order_lists(id) ON DELETE SET NULL;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_list_entries_list_id         ON list_entries(list_id);
CREATE INDEX IF NOT EXISTS idx_list_entry_products_entry_id ON list_entry_products(entry_id);
CREATE INDEX IF NOT EXISTS idx_orders_list_id               ON orders(list_id);
