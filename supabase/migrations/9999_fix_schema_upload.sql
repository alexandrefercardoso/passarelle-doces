-- =====================================================================
-- PASSARELLI DOCES — Correção de schema/upload
-- Cole e execute ESTE bloco no Supabase Dashboard → SQL Editor.
-- Inclui: 0003 (admin_emails/is_admin), 0004 (site_settings) e
-- 0005 (storage buckets). É idempotente (pode rodar várias vezes).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) admin_emails + função is_admin()  (migração 0003)
-- ---------------------------------------------------------------------
create table if not exists public.admin_emails (
  email text primary key
);

alter table public.admin_emails enable row level security;

drop policy if exists "Admins gerenciam a lista de e-mails" on public.admin_emails;
create policy "Admins gerenciam a lista de e-mails"
  on public.admin_emails for all
  using (public.is_admin())
  with check (public.is_admin());

delete from public.admin_emails
  where email not in ('alejandrecardoso@gmail.com');
insert into public.admin_emails (email) values
  ('alejandrecardoso@gmail.com')
on conflict (email) do nothing;

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
-- 2) site_settings  (migração 0004)
-- ---------------------------------------------------------------------
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null,
  description text,
  updated_at timestamptz default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "Leitura pública das configurações" on public.site_settings;
create policy "Leitura pública das configurações"
  on public.site_settings for select
  using (true);

drop policy if exists "Admins gerenciam configurações" on public.site_settings;
create policy "Admins gerenciam configurações"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.site_settings (key, value, description) values
  ('identity', '{
    "name": "PASSARELLI DOCES",
    "tagline": "Doces especiais para momentos especiais",
    "primaryColor": "#2a1510",
    "secondaryColor": "#c9a84c",
    "history": "A PASSARELLI DOCES nasceu do amor pela confeitaria artesanal.",
    "mission": "Levar alegria e doçura para a vida das pessoas.",
    "vision": "Ser a referência em doces artesanais no Brasil.",
    "values": [
      {"title": "Artesanal", "description": "Cada peça é feita à mão, com tempo e dedicação."},
      {"title": "Qualidade", "description": "Ingredientes selecionados e fornecedores de confiança."},
      {"title": "Carinho", "description": "Do preparo à entrega, tudo feito com amor."},
      {"title": "Inovação", "description": "Sabores únicos que surpreendem e encantam."}
    ],
    "productsPageBanner": "",
    "productsPageBannerAlt": "Nossos doces artesanais"
  }'::jsonb, 'Identidade visual, história, missão, visão, valores e banner da página de produtos'),
  ('contact', '{
    "email": "contato@passarellidoces.com.br",
    "phone": "(11) 98765-4321",
    "whatsapp": "5511987654321",
    "address": "Rua dos Doces, 123 - Centro · São Paulo/SP",
    "hours": "Segunda a sábado, das 09h às 19h",
    "mapUrl": "",
    "cnpj": "00.000.000/0000-00"
  }'::jsonb, 'Informações de contato exibidas no site'),
  ('social', '[
    {"platform": "instagram", "url": "https://instagram.com/passarellidoces", "label": "Instagram"},
    {"platform": "facebook", "url": "https://facebook.com/passarellidoces", "label": "Facebook"},
    {"platform": "whatsapp", "url": "https://wa.me/5511987654321", "label": "WhatsApp"}
  ]'::jsonb, 'Links de redes sociais exibidos no rodapé/header'),
  ('whatsapp', '{
    "number": "5511987654321",
    "defaultMessage": "Olá! Gostaria de fazer um pedido 🍬"
  }'::jsonb, 'Número e mensagem padrão do botão WhatsApp flutuante'),
  ('pages', '{
    "quemSomos": {"title": "Quem Somos", "subtitle": "Conheça nossa história", "content": "<p>Quem somos.</p>"},
    "nossaMissao": {"title": "Nossa Missão", "subtitle": "O que nos move", "content": "<p>Nossa missão.</p>"},
    "formasPagamento": {"title": "Formas de Pagamento", "subtitle": "Escolha a melhor opção", "content": "<p>Formas de pagamento.</p>"},
    "trocasDevolucoes": {"title": "Trocas e Devoluções", "subtitle": "Sua satisfação é nossa prioridade", "content": "<p>Trocas e devoluções.</p>"},
    "politicaPrivacidade": {"title": "Política de Privacidade", "subtitle": "Seus dados protegidos", "content": "<p>Política de privacidade.</p>"}
  }'::jsonb, 'Conteúdo das páginas institucionais (HTML)')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 3) Storage buckets  (migração 0005)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-images',
  'site-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

drop policy if exists "Leitura pública de imagens de produtos" on storage.objects;
create policy "Leitura pública de imagens de produtos"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "Admins fazem upload de imagens de produtos" on storage.objects;
create policy "Admins fazem upload de imagens de produtos"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and public.is_admin()
  );

drop policy if exists "Admins atualizam imagens de produtos" on storage.objects;
create policy "Admins atualizam imagens de produtos"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and public.is_admin()
  );

drop policy if exists "Admins deletam imagens de produtos" on storage.objects;
create policy "Admins deletam imagens de produtos"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and public.is_admin()
  );

drop policy if exists "Leitura pública de imagens do site" on storage.objects;
create policy "Leitura pública de imagens do site"
  on storage.objects for select
  using (bucket_id = 'site-images');

drop policy if exists "Admins fazem upload de imagens do site" on storage.objects;
create policy "Admins fazem upload de imagens do site"
  on storage.objects for insert
  with check (
    bucket_id = 'site-images'
    and public.is_admin()
  );

drop policy if exists "Admins atualizam imagens do site" on storage.objects;
create policy "Admins atualizam imagens do site"
  on storage.objects for update
  using (
    bucket_id = 'site-images'
    and public.is_admin()
  );

drop policy if exists "Admins deletam imagens do site" on storage.objects;
create policy "Admins deletam imagens do site"
  on storage.objects for delete
  using (
    bucket_id = 'site-images'
    and public.is_admin()
  );
