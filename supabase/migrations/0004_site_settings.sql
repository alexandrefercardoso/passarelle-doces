-- =====================================================================
-- PASSARELLI DOCES — Configurações do site (site_settings)
-- =====================================================================

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null,
  description text,
  updated_at timestamptz default now()
);

alter table public.site_settings enable row level security;

create policy "Leitura pública das configurações"
  on public.site_settings for select
  using (true);

create policy "Admins gerenciam configurações"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- Configurações iniciais
insert into public.site_settings (key, value, description) values
  ('identity', '{
    "name": "PASSARELLI DOCES",
    "tagline": "Doces especiais para momentos especiais",
    "primaryColor": "#2a1510",
    "secondaryColor": "#c9a84c"
  }'::jsonb, 'Identidade visual: nome, subtítulo e cores da marca'),
  ('contact', '{
    "email": "contato@passarellidoces.com.br",
    "phone": "(11) 98765-4321",
    "whatsapp": "5511987654321",
    "address": "Rua dos Doces, 123 - Centro · São Paulo/SP",
    "hours": "Segunda a sábado, das 09h às 19h",
    "mapUrl": "https://www.google.com/maps/embed?pb=...",
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
  }'::jsonb, 'Número e mensagem padrão do botão WhatsApp flutuante')
on conflict (key) do nothing;