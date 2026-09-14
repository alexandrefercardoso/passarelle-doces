export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string;
  gallery: string[];
  stock: number;
  minimumStock: number;
  barcode: string | null;
  unitLabel: string | null;
  isActive: boolean;
  isBestSeller: boolean;
  salesCount: number;
  badges: string[];
};

export type ProductWithCategory = Product & {
  category: Category | null;
  discountPercent: number | null;
  savings: number | null;
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  buttonText: string;
  linkUrl: string;
  sortOrder: number;
  isActive: boolean;
};

export type InstagramPost = {
  id: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
  isActive: boolean;
};

export type CartItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string;
  quantity: number;
  stock: number;
};

export type OrderItem = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  imageUrl: string;
};

export type OrderStatus =
  "aguardando_pagamento" | "confirmado" | "preparando" | "enviado" | "entregue" | "cancelado";

export type PaymentMethod = string;

export type PaymentOption = {
  id: string;
  name: string;
  description?: string;
  type: "imediato" | "aberto";
  discount?: number;
};

export type CustomerInfo = {
  name: string;
  email: string;
  phone: string;
  document: string;
  zipCode: string;
  address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  notes?: string;
};

export type ShippingMethod = {
  id: string;
  name: string;
  price: number;
  estimate: string;
  description?: string;
};

export type OrderSource = "pdv" | "site";

export type Order = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: "pendente" | "aprovado" | "recusado" | "cancelado";
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  customer: CustomerInfo;
  source: OrderSource;
};

export type SiteSettings = {
  // Identidade
  name: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  history: string;
  mission: string;
  vision: string;
  values: ValueItem[];
  productsPageBanner: string;
  productsPageBannerAlt: string;
  showPdvPrintOption: boolean;
  // Contato
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  hours: string;
  mapUrl: string;
  cnpj: string;
  // Redes sociais
  social: SocialLink[];
  // WhatsApp flutuante
  whatsappNumber: string;
  whatsappMessage: string;
  // Envio / Frete
  shippingMethods: ShippingMethod[];
  freeShippingThreshold: number;
  freeShippingEnabled: boolean;
  // Pagamentos
  paymentMethods: PaymentOption[];
  // Páginas institucionais
  pages: PageContents;
  // Promo
  promoMessage: string;
  // Armazenamento de imagens (provedor externo)
  imageProvider: ImageProvider;
};

export type ImageProvider = {
  cloudName: string;
  uploadPreset: string;
  folder: string;
};

export type ValueItem = {
  title: string;
  description: string;
};

export type PageContents = {
  quemSomos: PageContent;
  nossaMissao: PageContent;
  formasPagamento: PageContent;
  trocasDevolucoes: PageContent;
  politicaPrivacidade: PageContent;
  [key: string]: PageContent;
};

export type PageContent = {
  title: string;
  subtitle: string;
  content: string;
};

export type SocialLink = {
  platform: "instagram" | "facebook" | "whatsapp" | "tiktok" | "youtube" | string;
  url: string;
  label: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  document: string;
  zipCode: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};
