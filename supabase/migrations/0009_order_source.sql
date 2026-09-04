-- ============================================================
-- 0009_order_source.sql
-- Adiciona coluna 'source' para distinguir pedidos PDV do site.
-- ============================================================

-- Adicionar coluna source (default 'site' para pedidos existentes)
alter table public.orders
  add column if not exists source text not null default 'site';

-- Atualizar pedidos existentes que começam com 'PD-' para source = 'pdv'
update public.orders set source = 'pdv' where id like 'PD-%';

-- Índice para filtrar por origem
create index if not exists idx_orders_source on public.orders (source);
