-- =====================================================================
-- PASSARELLI DOCES — Correção da recursão infinita no RLS de admin_emails
-- O policy "Admins gerenciam a lista de e-mails" consultava a própria
-- tabela admin_emails dentro do USING, causando infinite recursion (500).
-- Correção: usar a função is_admin() que é SECURITY DEFINER e não
-- dispara políticas RLS.
-- =====================================================================

-- 1) Corrigir política RLS de admin_emails (parar de consultar a si mesma)
drop policy if exists "Admins gerenciam a lista de e-mails" on public.admin_emails;
create policy "Admins gerenciam a lista de e-mails"
  on public.admin_emails for all
  using (public.is_admin())
  with check (public.is_admin());

-- 2) Corrigir políticas de storage que tinham o mesmo problema
-- (consultavam admin_emails diretamente ao invés de usar is_admin())
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
