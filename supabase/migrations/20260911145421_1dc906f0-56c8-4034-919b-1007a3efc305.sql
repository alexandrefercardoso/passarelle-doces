create extension if not exists "pgcrypto";
revoke all on schema public from sandbox_exec;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  image_url text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12, 2) not null default 0,
  compare_at_price numeric(12, 2),
  image_url text not null,
  gallery jsonb default '[]'::jsonb,
  stock integer not null default 0,
  is_active boolean not null default true,
  is_best_seller boolean not null default false,
  sales_count integer not null default 0,
  badges jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_active on public.products(is_active);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text not null,
  button_text text,
  link_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.instagram_posts (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  link_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'aguardando_pagamento',
  payment_method text not null,
  payment_status text not null default 'pendente',
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  shipping numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  customer jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

grant select on public.categories to anon;
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
grant select on public.banners to anon;
grant select, insert, update, delete on public.banners to authenticated;
grant all on public.banners to service_role;
grant select on public.instagram_posts to anon;
grant select, insert, update, delete on public.instagram_posts to authenticated;
grant all on public.instagram_posts to service_role;
grant select, insert on public.orders to anon;
grant select, insert, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;
grant select, insert, update, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.banners enable row level security;
alter table public.instagram_posts enable row level security;
alter table public.orders enable row level security;
alter table public.favorites enable row level security;

drop policy if exists "Categorias visíveis para todos" on public.categories;
create policy "Categorias visíveis para todos" on public.categories for select using (true);
drop policy if exists "Categorias gerenciadas por usuários autenticados" on public.categories;
create policy "Categorias gerenciadas por usuários autenticados" on public.categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Produtos visíveis para todos" on public.products;
create policy "Produtos visíveis para todos" on public.products for select using (true);
drop policy if exists "Produtos gerenciados por usuários autenticados" on public.products;
create policy "Produtos gerenciados por usuários autenticados" on public.products for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Banners visíveis para todos" on public.banners;
create policy "Banners visíveis para todos" on public.banners for select using (true);
drop policy if exists "Banners gerenciados por usuários autenticados" on public.banners;
create policy "Banners gerenciados por usuários autenticados" on public.banners for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Posts visíveis para todos" on public.instagram_posts;
create policy "Posts visíveis para todos" on public.instagram_posts for select using (true);
drop policy if exists "Posts gerenciados por usuários autenticados" on public.instagram_posts;
create policy "Posts gerenciados por usuários autenticados" on public.instagram_posts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Clientes veem os próprios pedidos" on public.orders;
create policy "Clientes veem os próprios pedidos" on public.orders for select using (auth.uid() = user_id or auth.role() = 'authenticated');
drop policy if exists "Clientes criam os próprios pedidos" on public.orders;
create policy "Clientes criam os próprios pedidos" on public.orders for insert with check (true);
drop policy if exists "Admins atualizam pedidos" on public.orders;
create policy "Admins atualizam pedidos" on public.orders for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Usuários gerenciam os próprios favoritos" on public.favorites;
create policy "Usuários gerenciam os próprios favoritos" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);