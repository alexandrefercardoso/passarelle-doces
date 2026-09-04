-- ============================================================
-- 0010_product_stock_barcode.sql
-- Adiciona colunas minimum_stock e barcode para controle de
-- estoque mínimo e código de barras dos produtos.
-- ============================================================

alter table public.products
  add column if not exists minimum_stock integer not null default 0;

alter table public.products
  add column if not exists barcode text;

-- Índice para busca por código de barras
create index if not exists idx_products_barcode on public.products (barcode);