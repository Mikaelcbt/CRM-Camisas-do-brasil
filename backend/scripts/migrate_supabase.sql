-- CRM Camisas — Database Migration (idempotent)
-- Run this in the Supabase SQL Editor

-- ─── Core tables ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
    id          BIGSERIAL PRIMARY KEY,
    full_name   TEXT NOT NULL,
    phone       TEXT NOT NULL,
    email       TEXT,
    cpf         TEXT,
    address     JSONB,
    preferences JSONB,
    tags        TEXT[],
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id           BIGSERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    normal_price NUMERIC(10,2) NOT NULL CHECK (normal_price >= 0),
    photo_url    TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id          BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    status      TEXT NOT NULL DEFAULT 'pending',
    total       NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    notes       TEXT,
    paid_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id         BIGSERIAL PRIMARY KEY,
    order_id   BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity   INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0)
);

CREATE TABLE IF NOT EXISTS kanban_cards (
    id          BIGSERIAL PRIMARY KEY,
    content     TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'novo',
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Add columns to existing tables ──────────────────────────────────────────

ALTER TABLE products    ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE orders      ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL;

-- ─── Migrate old order statuses → new model ───────────────────────────────────
-- Old: pending, confirmed, shipped, delivered, cancelled
-- New: pending, paid, delivered, cancelled

UPDATE orders SET status = 'pending'   WHERE status = 'confirmed';
UPDATE orders SET status = 'delivered' WHERE status = 'shipped';
-- 'delivered' and 'cancelled' stay the same

-- Remove old CHECK constraint (may have been auto-named by Supabase)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD  CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'paid', 'delivered', 'cancelled'));

-- ─── Migrate old kanban statuses → new pipeline ───────────────────────────────
-- Old: novo, contato, proposta, fechado, perdido
-- New: novo, contato, pedido, pago, entregue

UPDATE kanban_cards SET status = 'contato'  WHERE status = 'proposta';
UPDATE kanban_cards SET status = 'pago'     WHERE status = 'fechado';
UPDATE kanban_cards SET status = 'entregue' WHERE status NOT IN ('novo','contato','pedido','pago','entregue');

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_orders_customer_id    ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status         ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at     ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id  ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_kanban_customer        ON kanban_cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_kanban_status          ON kanban_cards(status);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Supabase Storage bucket for product images ───────────────────────────────
-- Run this block if the bucket doesn't exist yet:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('product-images', 'product-images', true)
-- ON CONFLICT (id) DO NOTHING;
