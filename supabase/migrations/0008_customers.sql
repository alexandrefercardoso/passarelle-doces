-- ============================================================
-- 0008_customers.sql
-- Tabela de clientes para o PDV e gerenciamento admin.
-- ============================================================

create table if not exists public.customers (
  id          text primary key,
  name        text not null,
  phone       text not null default '',
  email       text not null default '',
  document    text not null default '',  -- CPF ou CNPJ
  zip_code    text not null default '',
  address     text not null default '',
  number      text not null default '',
  complement  text not null default '',
  neighborhood text not null default '',
  city        text not null default '',
  state       text not null default '',
  notes       text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.customers enable row level security;

-- Admins têm acesso total
create policy "Clientes gerenciados por admins"
  on public.customers
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Índices para busca
create index if not exists idx_customers_name on public.customers (name);
create index if not exists idx_customers_phone on public.customers (phone);
create index if not exists idx_customers_document on public.customers (document);
