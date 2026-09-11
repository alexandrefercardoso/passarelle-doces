
create table if not exists public.admin_emails (email text primary key);
alter table public.admin_emails enable row level security;
grant select on public.admin_emails to authenticated;
grant all on public.admin_emails to service_role;
delete from public.admin_emails where email not in ('alejandrecardoso@gmail.com');
insert into public.admin_emails (email) values ('alejandrecardoso@gmail.com') on conflict do nothing;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_emails a where a.email = auth.jwt() ->> 'email');
$$;

drop policy if exists "Admins gerenciam a lista de e-mails" on public.admin_emails;
create policy "Admins gerenciam a lista de e-mails" on public.admin_emails for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null,
  description text,
  updated_at timestamptz default now()
);
alter table public.site_settings enable row level security;
grant select on public.site_settings to anon;
grant select, insert, update, delete on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
drop policy if exists "Leitura pública das configurações" on public.site_settings;
create policy "Leitura pública das configurações" on public.site_settings for select using (true);
drop policy if exists "Admins gerenciam configurações" on public.site_settings;
create policy "Admins gerenciam configurações" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.customers (
  id text primary key,
  name text not null,
  phone text not null default '',
  email text not null default '',
  document text not null default '',
  zip_code text not null default '',
  address text not null default '',
  number text not null default '',
  complement text not null default '',
  neighborhood text not null default '',
  city text not null default '',
  state text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.customers enable row level security;
grant select, insert, update, delete on public.customers to authenticated;
grant all on public.customers to service_role;
drop policy if exists "Clientes gerenciados por admins" on public.customers;
create policy "Clientes gerenciados por admins" on public.customers for all using (public.is_admin()) with check (public.is_admin());
create index if not exists idx_customers_name on public.customers (name);
create index if not exists idx_customers_phone on public.customers (phone);
create index if not exists idx_customers_document on public.customers (document);

alter table public.orders add column if not exists source text not null default 'site';
update public.orders set source = 'pdv' where id like 'PD-%';
create index if not exists idx_orders_source on public.orders (source);

alter table public.products add column if not exists minimum_stock integer not null default 0;
alter table public.products add column if not exists barcode text;

grant select on public.products, public.categories, public.banners, public.instagram_posts to anon;
grant select, insert, update, delete on public.products, public.categories, public.banners, public.instagram_posts, public.orders, public.favorites to authenticated;
grant insert, select on public.orders to anon;
grant all on public.products, public.categories, public.banners, public.instagram_posts, public.orders, public.favorites to service_role;

drop policy if exists "Clientes veem os próprios pedidos" on public.orders;
drop policy if exists "Clientes criam os próprios pedidos" on public.orders;
drop policy if exists "Admins atualizam pedidos" on public.orders;
drop policy if exists "Criação de pedidos por qualquer pessoa" on public.orders;
drop policy if exists "Admins veem todos os pedidos" on public.orders;
drop policy if exists "Admins deletam pedidos" on public.orders;
create policy "Criação de pedidos por qualquer pessoa" on public.orders for insert with check (true);
create policy "Clientes veem os próprios pedidos" on public.orders for select using (auth.uid() = user_id);
create policy "Admins veem todos os pedidos" on public.orders for select using (public.is_admin());
create policy "Admins atualizam pedidos" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins deletam pedidos" on public.orders for delete using (public.is_admin());

drop policy if exists "Produtos gerenciados por usuários autenticados" on public.products;
drop policy if exists "Categorias gerenciadas por usuários autenticados" on public.categories;
drop policy if exists "Banners gerenciados por usuários autenticados" on public.banners;
drop policy if exists "Posts gerenciados por usuários autenticados" on public.instagram_posts;
drop policy if exists "Produtos gerenciados por admins" on public.products;
drop policy if exists "Categorias gerenciadas por admins" on public.categories;
drop policy if exists "Banners gerenciados por admins" on public.banners;
drop policy if exists "Posts gerenciados por admins" on public.instagram_posts;
create policy "Produtos gerenciados por admins" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "Categorias gerenciadas por admins" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "Banners gerenciados por admins" on public.banners for all using (public.is_admin()) with check (public.is_admin());
create policy "Posts gerenciados por admins" on public.instagram_posts for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Usuários gerenciam os próprios favoritos" on public.favorites;
create policy "Usuários gerenciam os próprios favoritos" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Leitura pública de imagens de produtos" on storage.objects;
create policy "Leitura pública de imagens de produtos" on storage.objects for select using (bucket_id = 'product-images');
drop policy if exists "Admins fazem upload de imagens de produtos" on storage.objects;
create policy "Admins fazem upload de imagens de produtos" on storage.objects for insert with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "Admins atualizam imagens de produtos" on storage.objects;
create policy "Admins atualizam imagens de produtos" on storage.objects for update using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "Admins deletam imagens de produtos" on storage.objects;
create policy "Admins deletam imagens de produtos" on storage.objects for delete using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "Leitura pública de imagens do site" on storage.objects;
create policy "Leitura pública de imagens do site" on storage.objects for select using (bucket_id = 'site-images');
drop policy if exists "Admins fazem upload de imagens do site" on storage.objects;
create policy "Admins fazem upload de imagens do site" on storage.objects for insert with check (bucket_id = 'site-images' and public.is_admin());
drop policy if exists "Admins atualizam imagens do site" on storage.objects;
create policy "Admins atualizam imagens do site" on storage.objects for update using (bucket_id = 'site-images' and public.is_admin());
drop policy if exists "Admins deletam imagens do site" on storage.objects;
create policy "Admins deletam imagens do site" on storage.objects for delete using (bucket_id = 'site-images' and public.is_admin());
