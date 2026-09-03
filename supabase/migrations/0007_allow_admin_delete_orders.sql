-- ---------------------------------------------------------------------
-- Permitir que admins excluam pedidos
-- ---------------------------------------------------------------------

create policy "Admins excluem pedidos"
  on public.orders for delete
  using (public.is_admin());
