-- ============================================================
-- 0011_product_unit_label.sql
-- Adiciona a coluna unit_label para exibir a unidade de medida
-- do produto (ex.: un, kg, caixa, pote) junto ao preço.
-- ============================================================

alter table public.products
  add column if not exists unit_label text;