-- =====================================================================
-- PASSARELLI DOCES — Modo produção (RLS refinado)
-- Rode no SQL Editor do Supabase após o 0001 e 0002.
--
-- 1) Cria a tabela admin_emails (e-mails autorizados no painel admin).
-- 2) Permite que visitantes criem pedidos (compra como visitante).
-- 3) Ajusta as políticas para que clientes vejam APENAS os próprios
--    pedidos e admins vejam todos (incluindo atualização de status).
-- =====================================================================

-- ---------------------------------------------------------------------
-- admin_emails
-- ---------------------------------------------------------------------
create table if not exists public.admin_emails (
  email text primary key
);

alter table public.admin_emails enable row level security;

drop policy if exists "Admins gerenciam a lista de e-mails" on public.admin_emails;

create policy "Admins gerenciam a lista de e-mails"
  on public.admin_emails for all
  using (
    exists (select 1 from public.admin_emails a where a.email = auth.jwt() ->> 'email')
  )
  with check (
    exists (select 1 from public.admin_emails a where a.email = auth.jwt() ->> 'email')
  );

-- Substitui a lista de administradores (remove e-mails antigos e insere o atual).
delete from public.admin_emails
  where email not in ('alejandrecardoso@gmail.com');

insert into public.admin_emails (email) values
  ('alejandrecardoso@gmail.com')
on conflict (email) do nothing;

-- Helper: o usuário autenticado atual é admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_emails a
    where a.email = auth.jwt() ->> 'email'
  );
$$;

-- ---------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------

drop policy if exists "Clientes veem os próprios pedidos" on public.orders;
drop policy if exists "Clientes criam os próprios pedidos" on public.orders;
drop policy if exists "Admins atualizam pedidos" on public.orders;
drop policy if exists "Criação de pedidos por qualquer pessoa" on public.orders;

-- Visitantes e clientes logados podem criar pedidos (user_id fica null
-- para visitantes; o acompanhamento ocorre por e-mail/WhatsApp).
create policy "Criação de pedidos por qualquer pessoa"
  on public.orders for insert
  with check (true);

-- Cliente logado vê apenas os próprios pedidos.
create policy "Clientes veem os próprios pedidos"
  on public.orders for select
  using (auth.uid() = user_id);

-- Admin vê todos os pedidos.
create policy "Admins veem todos os pedidos"
  on public.orders for select
  using (public.is_admin());

-- Admin atualiza o status dos pedidos.
create policy "Admins atualizam pedidos"
  on public.orders for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- products / categories / banners / instagram_posts
-- ---------------------------------------------------------------------

-- Apenas admins podem gerenciar o catálogo (remover a política de
-- "qualquer autenticado" para escrita).
drop policy if exists "Produtos gerenciados por usuários autenticados" on public.products;
drop policy if exists "Categorias gerenciadas por usuários autenticados" on public.categories;
drop policy if exists "Banners gerenciados por usuários autenticados" on public.banners;
drop policy if exists "Posts gerenciados por usuários autenticados" on public.instagram_posts;

create policy "Produtos gerenciados por admins"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Categorias gerenciadas por admins"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Banners gerenciados por admins"
  on public.banners for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Posts gerenciados por admins"
  on public.instagram_posts for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------

drop policy if exists "Usuários gerenciam os próprios favoritos" on public.favorites;

create policy "Usuários gerenciam os próprios favoritos"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);