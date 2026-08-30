-- =====================================================================
-- PASSARELLI DOCES — Supabase Storage para imagens
-- =====================================================================

-- Bucket para imagens de produtos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Bucket para banners e imagens gerais do site
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-images',
  'site-images',
  true,
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Políticas para product-images (público para leitura, admin para escrita)
create policy "Leitura pública de imagens de produtos"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Admins fazem upload de imagens de produtos"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.admin_emails a where a.email = auth.jwt() ->> 'email')
  );

create policy "Admins atualizam imagens de produtos"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.admin_emails a where a.email = auth.jwt() ->> 'email')
  );

create policy "Admins deletam imagens de produtos"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.admin_emails a where a.email = auth.jwt() ->> 'email')
  );

-- Políticas para site-images (público para leitura, admin para escrita)
create policy "Leitura pública de imagens do site"
  on storage.objects for select
  using (bucket_id = 'site-images');

create policy "Admins fazem upload de imagens do site"
  on storage.objects for insert
  with check (
    bucket_id = 'site-images'
    and exists (select 1 from public.admin_emails a where a.email = auth.jwt() ->> 'email')
  );

create policy "Admins atualizam imagens do site"
  on storage.objects for update
  using (
    bucket_id = 'site-images'
    and exists (select 1 from public.admin_emails a where a.email = auth.jwt() ->> 'email')
  );

create policy "Admins deletam imagens do site"
  on storage.objects for delete
  using (
    bucket_id = 'site-images'
    and exists (select 1 from public.admin_emails a where a.email = auth.jwt() ->> 'email')
  );