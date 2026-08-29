import type { SiteSettings } from "./types";

/**
 * Configurações institucionais da PASSARELLI DOCES.
 * Futuramente podem ser gerenciadas pelo painel administrativo
 * (tabela site_settings no Supabase).
 */
export const SITE_NAME = "PASSARELLI DOCES";
export const SITE_TAGLINE = "Doces especiais para momentos especiais";

export const DEFAULT_SETTINGS: SiteSettings = {
  whatsapp: "11987654321",
  instagram: "@passarellidoces",
  facebook: "passarellidoces",
  email: "contato@passarellidoces.com.br",
  phone: "(11) 98765-4321",
  address: "Rua dos Doces, 123 - Centro · São Paulo/SP",
  hours: "Segunda a sábado, das 09h às 19h",
  promoMessage: "Doces especiais para deixar seu dia ainda mais doce 🍬",
};

export const ADMINS = ["admin@passarellidoces.com.br", "passarelli@somai.co"];

export const MENU_HIGHLIGHTED_CATEGORIES = [
  "doces-tradicionais",
  "doces-gourmet",
  "chocolates",
  "bolos",
];

export const SHIPPING_METHODS = [
  {
    id: "retirada",
    name: "Retirada na loja",
    price: 0,
    estimate: "Pronto no mesmo dia",
  },
  {
    id: "express",
    name: "Entrega expressa (capital)",
    price: 19.9,
    estimate: "2 a 5 dias úteis",
  },
  {
    id: "normal",
    name: "Encomenda (demais regiões)",
    price: 29.9,
    estimate: "5 a 10 dias úteis",
  },
];

export const FREE_SHIPPING_THRESHOLD = 199;
