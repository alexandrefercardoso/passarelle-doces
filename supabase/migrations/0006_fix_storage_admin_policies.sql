-- =====================================================================
-- PASSARELLI DOCES — Correção do erro de upload
-- "The database schema is invalid or incompatible"
-- =====================================================================
-- Causa raiz: as políticas de storage.objects consultavam
-- public.admin_emails diretamente (um SELECT com RLS ativo), o que gera
-- recursão infinita na avaliação das políticas e o Supabase Storage
-- reporta como DatabaseInvalidObjectDefinition.
--
-- Correção: usar a função SECURITY DEFINER public.is_admin(), que
-- executa com privilégios de quem a criou e ignora o RLS, quebrando a
-- recursão — o mesmo padrão já usado em site_settings.
-- =====================================================================

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
