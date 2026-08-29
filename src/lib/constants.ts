import type { SiteSettings } from "./types";

/**
 * Configurações institucionais da PASSARELLI DOCES.
 * Futuramente podem ser gerenciadas pelo painel administrativo
 * (tabela site_settings no Supabase).
 */
export const SITE_NAME = "PASSARELLI DOCES";
export const SITE_TAGLINE = "Doces especiais para momentos especiais";

export const DEFAULT_SETTINGS: SiteSettings = {
  // Identidade
  name: "PASSARELLI DOCES",
  tagline: "Doces especiais para momentos especiais",
  primaryColor: "#2a1510",
  secondaryColor: "#c9a84c",
  // Contato
  email: "contato@passarellidoces.com.br",
  phone: "(11) 98765-4321",
  whatsapp: "5511987654321",
  address: "Rua dos Doces, 123 - Centro · São Paulo/SP",
  hours: "Segunda a sábado, das 09h às 19h",
  mapUrl: "https://www.google.com/maps/embed?pb=...",
  // Redes sociais
  social: [
    { platform: "instagram", url: "https://instagram.com/passarellidoces", label: "Instagram" },
    { platform: "facebook", url: "https://facebook.com/passarellidoces", label: "Facebook" },
    { platform: "whatsapp", url: "https://wa.me/5511987654321", label: "WhatsApp" },
  ],
  // WhatsApp flutuante
  whatsappNumber: "5511987654321",
  whatsappMessage: "Olá! Gostaria de fazer um pedido 🍬",
  // Promo
  promoMessage: "Doces especiais para deixar seu dia ainda mais doce 🍬",
};

export const ADMINS = ["alejandrecardoso@gmail.com"];

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
