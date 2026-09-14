import { supabase } from "@/integrations/supabase/client";
import type {
  Banner,
  Category,
  Customer,
  ImageProvider,
  InstagramPost,
  Order,
  Product,
  ProductWithCategory,
  PaymentOption,
  ShippingMethod,
  SiteSettings,
  SocialLink,
  ValueItem,
  PageContents,
  PageContent,
} from "./types";

/**
 * Camada de acesso a dados da PASSARELLI DOCES.
 *
 * Todas as operações são feitas diretamente no Supabase (PostgreSQL),
 * sem dados de demonstração. Produtos, categorias, banners e posts são
 * lidos das tabelas públicas; pedidos seguem a política RLS (visitantes
 * podem criar pedidos; clientes logados veem os próprios; o admin vê todos).
 */

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

function applyDiscount(product: Product, categories: Category[]): ProductWithCategory {
  const category = categories.find((c) => c.id === product.categoryId) ?? null;
  let discountPercent: number | null = null;
  let savings: number | null = null;
  if (product.compareAtPrice && product.compareAtPrice > product.price) {
    discountPercent = Math.round(
      ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100,
    );
    savings = product.compareAtPrice - product.price;
  }
  return { ...product, category, discountPercent, savings };
}

function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row["id"]),
    slug: String(row["slug"]),
    name: String(row["name"]),
    description: (row["description"] as string | null) ?? "",
    imageUrl: String(row["image_url"]),
    sortOrder: (row["sort_order"] as number) ?? 0,
    isActive: Boolean(row["is_active"]),
  };
}

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row["id"]),
    categoryId: String(row["category_id"]),
    name: String(row["name"]),
    slug: String(row["slug"]),
    description: (row["description"] as string | null) ?? "",
    price: Number(row["price"]),
    compareAtPrice: row["compare_at_price"] !== null ? Number(row["compare_at_price"]) : null,
    imageUrl: String(row["image_url"]),
    gallery: (row["gallery"] as string[]) ?? [],
    stock: (row["stock"] as number) ?? 0,
    minimumStock: (row["minimum_stock"] as number) ?? 0,
    barcode: (row["barcode"] as string | null) ?? null,
    unitLabel: (row["unit_label"] as string | null) ?? null,
    isActive: Boolean(row["is_active"]),
    isBestSeller: Boolean(row["is_best_seller"]),
    salesCount: (row["sales_count"] as number) ?? 0,
    badges: (row["badges"] as string[]) ?? [],
  };
}

function mapBanner(row: Record<string, unknown>): Banner {
  return {
    id: String(row["id"]),
    title: String(row["title"]),
    subtitle: (row["subtitle"] as string | null) ?? "",
    imageUrl: String(row["image_url"]),
    buttonText: (row["button_text"] as string | null) ?? "Ver Produtos",
    linkUrl: (row["link_url"] as string | null) ?? "/produtos",
    sortOrder: (row["sort_order"] as number) ?? 0,
    isActive: Boolean(row["is_active"]),
  };
}

function mapInstagramPost(row: Record<string, unknown>): InstagramPost {
  return {
    id: String(row["id"]),
    imageUrl: String(row["image_url"]),
    linkUrl: (row["link_url"] as string | null) ?? "#",
    sortOrder: (row["sort_order"] as number) ?? 0,
    isActive: Boolean(row["is_active"]),
  };
}

function mapOrder(row: Record<string, unknown>): Order {
  const id = String(row["id"]);
  const source = (row["source"] as Order["source"]) ?? (id.startsWith("PD-") ? "pdv" : "site");
  return {
    id,
    createdAt: String(row["created_at"]),
    status: row["status"] as Order["status"],
    paymentMethod: row["payment_method"] as Order["paymentMethod"],
    paymentStatus: row["payment_status"] as Order["paymentStatus"],
    items: row["items"] as Order["items"],
    subtotal: Number(row["subtotal"]),
    discount: Number(row["discount"]),
    shipping: Number(row["shipping"]),
    total: Number(row["total"]),
    customer: row["customer"] as Order["customer"],
    source,
  };
}

function mapCustomer(row: Record<string, unknown>): Customer {
  return {
    id: String(row["id"]),
    name: String(row["name"]),
    phone: String(row["phone"] ?? ""),
    email: String(row["email"] ?? ""),
    document: String(row["document"] ?? ""),
    zipCode: String(row["zip_code"] ?? ""),
    address: String(row["address"] ?? ""),
    number: String(row["number"] ?? ""),
    complement: String(row["complement"] ?? ""),
    neighborhood: String(row["neighborhood"] ?? ""),
    city: String(row["city"] ?? ""),
    state: String(row["state"] ?? ""),
    notes: String(row["notes"] ?? ""),
    createdAt: String(row["created_at"]),
    updatedAt: String(row["updated_at"]),
  };
}

/* ------------------------------------------------------------------ */
/* Categorias                                                          */
/* ------------------------------------------------------------------ */

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => mapCategory(row as Record<string, unknown>));
}

export async function fetchActiveCategories(): Promise<Category[]> {
  return fetchCategories();
}

/* ------------------------------------------------------------------ */
/* Produtos                                                            */
/* ------------------------------------------------------------------ */

export async function fetchCategoriesAll(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []).map((row) => mapCategory(row as Record<string, unknown>));
}

export async function fetchProducts(): Promise<ProductWithCategory[]> {
  const [productsRes, categoriesRes] = await Promise.all([
    supabase.from("products").select("*"),
    supabase.from("categories").select("*"),
  ]);
  if (productsRes.error) throw productsRes.error;
  if (categoriesRes.error) throw categoriesRes.error;
  const categories = (categoriesRes.data ?? []).map((row) =>
    mapCategory(row as Record<string, unknown>),
  );
  return (productsRes.data ?? [])
    .map((row) => mapProduct(row as Record<string, unknown>))
    .map((product) => applyDiscount(product, categories));
}

export async function fetchProductBySlug(slug: string): Promise<ProductWithCategory | null> {
  const products = await fetchProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

export async function fetchProductsByCategory(
  categorySlug: string,
): Promise<ProductWithCategory[]> {
  const products = await fetchProducts();
  return products.filter((p) => p.category?.slug === categorySlug);
}

export async function fetchFeaturedProducts(): Promise<ProductWithCategory[]> {
  const products = await fetchProducts();
  return [...products].filter((p) => p.isActive && (isBestSeller(p) || p.isBestSeller)).slice(0, 8);
}

export async function fetchBestSellers(): Promise<ProductWithCategory[]> {
  const products = await fetchProducts();
  return [...products]
    .filter((p) => p.isActive)
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 8);
}

export async function fetchOnSaleProducts(): Promise<ProductWithCategory[]> {
  const products = await fetchProducts();
  return products.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price);
}

export async function searchProducts(query: string): Promise<ProductWithCategory[]> {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  const products = await fetchProducts();
  return products
    .filter((p) => {
      return (
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        (p.category?.name.toLowerCase().includes(term) ?? false) ||
        p.badges.some((b) => b.toLowerCase().includes(term))
      );
    })
    .slice(0, 8);
}

function isBestSeller(p: ProductWithCategory): boolean {
  return p.isBestSeller || p.salesCount >= 300;
}

/* ------------------------------------------------------------------ */
/* Banners                                                             */
/* ------------------------------------------------------------------ */

export async function fetchBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => mapBanner(row as Record<string, unknown>));
}

/* ------------------------------------------------------------------ */
/* Instagram                                                            */
/* ------------------------------------------------------------------ */

export async function fetchInstagramPosts(): Promise<InstagramPost[]> {
  const { data, error } = await supabase
    .from("instagram_posts")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => mapInstagramPost(row as Record<string, unknown>));
}

export async function adminFetchInstagramPosts(): Promise<InstagramPost[]> {
  const { data, error } = await supabase
    .from("instagram_posts")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => mapInstagramPost(row as Record<string, unknown>));
}

export async function adminInsertInstagramPost(
  post: InstagramPost,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("instagram_posts").insert({
    id: post.id,
    image_url: post.imageUrl,
    link_url: post.linkUrl,
    sort_order: post.sortOrder,
    is_active: post.isActive,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminUpdateInstagramPost(
  post: InstagramPost,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("instagram_posts")
    .update({
      image_url: post.imageUrl,
      link_url: post.linkUrl,
      sort_order: post.sortOrder,
      is_active: post.isActive,
    })
    .eq("id", post.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminDeleteInstagramPost(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("instagram_posts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Pedidos                                                             */
/* ------------------------------------------------------------------ */

export async function saveOrder(order: Order): Promise<{ ok: boolean }> {
  const ownerId = (await supabase.auth.getUser().catch(() => null))?.data?.user?.id ?? null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("orders").insert({
    id: order.id,
    user_id: ownerId,
    status: order.status,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
    items: order.items,
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    total: order.total,
    customer: order.customer,
    source: order.source,
  });
  if (error) throw error;
  return { ok: true };
}

export async function fetchOrders(): Promise<Order[]> {
  const ownerId = (await supabase.auth.getUser().catch(() => null))?.data?.user?.id ?? null;
  if (!ownerId) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapOrder(row as Record<string, unknown>));
}

export async function fetchAllOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapOrder(row as Record<string, unknown>));
}

export async function adminDeleteOrder(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminUpdateOrderPaymentStatus(
  id: string,
  paymentStatus: string,
): Promise<{ ok: boolean; error?: string }> {
  const updateData: { payment_status: string; status?: string } = { payment_status: paymentStatus };
  if (paymentStatus === "aprovado") {
    updateData.status = "confirmado";
  }
  const { data, error } = await supabase.from("orders").update(updateData).eq("id", id).select();
  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: "Nenhum pedido encontrado ou sem permissão para atualizar." };
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Favoritos                                                           */
/* ------------------------------------------------------------------ */

const WISHLIST_STORAGE_KEY = "passarelli_wishlist";

export function readLocalWishlist(): string[] {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function persistLocalWishlist(ids: string[]): void {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignora
  }
}

export async function syncWishlistWithUser(ids: string[]): Promise<void> {
  const user = (await supabase.auth.getUser().catch(() => null))?.data?.user;
  if (!user) return;
  const { error } = await supabase.from("favorites").upsert(
    ids.map((productId) => ({ user_id: user.id, product_id: productId })),
    { onConflict: "user_id,product_id" },
  );
  if (error) throw error;
}

export async function loadUserWishlist(): Promise<string[]> {
  const user = (await supabase.auth.getUser().catch(() => null))?.data?.user;
  if (!user) return [];
  const { data, error } = await supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", user.id);
  if (error) throw error;
  return (data ?? []).map((row) => String(row.product_id));
}

/* ------------------------------------------------------------------ */
/* Configurações do site                                               */
/* ------------------------------------------------------------------ */

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await (supabase as any)
    .from("site_settings")
    .select("key, value")
    .in("key", [
      "identity",
      "contact",
      "social",
      "whatsapp",
      "pages",
      "imageProvider",
      "shipping",
      "payments",
    ]);

  if (error) {
    const { DEFAULT_SETTINGS } = await import("./constants");
    return DEFAULT_SETTINGS;
  }

  const settings: Record<string, unknown> = {};
  (data ?? []).forEach((row: Record<string, unknown>) => {
    settings[row["key"] as string] = row["value"];
  });

  const identity = (settings["identity"] as Record<string, unknown>) ?? {};
  const contact = (settings["contact"] as Record<string, unknown>) ?? {};
  const social = (settings["social"] as SocialLink[]) ?? [];
  const whatsapp = (settings["whatsapp"] as Record<string, unknown>) ?? {};
  const pages = (settings["pages"] as PageContents) ?? {};
  const shipping = (settings["shipping"] as Record<string, unknown>) ?? {};
  const payments = (settings["payments"] as Record<string, unknown>) ?? {};
  const { DEFAULT_SETTINGS } = await import("./constants");
  const imageProvider =
    (settings["imageProvider"] as ImageProvider) ?? DEFAULT_SETTINGS.imageProvider;

  return {
    name: (identity["name"] as string) ?? DEFAULT_SETTINGS.name ?? "PASSARELLI DOCES",
    tagline:
      (identity["tagline"] as string) ??
      DEFAULT_SETTINGS.tagline ??
      "Doces especiais para momentos especiais",
    primaryColor: (identity["primaryColor"] as string) ?? "#2a1510",
    secondaryColor: (identity["secondaryColor"] as string) ?? "#c9a84c",
    history: (identity["history"] as string) ?? DEFAULT_SETTINGS.history,
    mission: (identity["mission"] as string) ?? DEFAULT_SETTINGS.mission,
    vision: (identity["vision"] as string) ?? DEFAULT_SETTINGS.vision,
    values: (identity["values"] as ValueItem[]) ?? DEFAULT_SETTINGS.values,
    productsPageBanner:
      (identity["productsPageBanner"] as string) ?? DEFAULT_SETTINGS.productsPageBanner,
    productsPageBannerAlt:
      (identity["productsPageBannerAlt"] as string) ?? DEFAULT_SETTINGS.productsPageBannerAlt,
    showPdvPrintOption:
      (identity["showPdvPrintOption"] as boolean) ?? DEFAULT_SETTINGS.showPdvPrintOption,
    email: (contact["email"] as string) ?? DEFAULT_SETTINGS.email,
    phone: (contact["phone"] as string) ?? DEFAULT_SETTINGS.phone,
    whatsapp: (contact["whatsapp"] as string) ?? DEFAULT_SETTINGS.whatsapp,
    address: (contact["address"] as string) ?? DEFAULT_SETTINGS.address,
    hours: (contact["hours"] as string) ?? DEFAULT_SETTINGS.hours,
    mapUrl: (contact["mapUrl"] as string) ?? "",
    cnpj: (contact["cnpj"] as string) ?? DEFAULT_SETTINGS.cnpj,
    social,
    whatsappNumber: (whatsapp["number"] as string) ?? DEFAULT_SETTINGS.whatsappNumber,
    whatsappMessage: (whatsapp["defaultMessage"] as string) ?? DEFAULT_SETTINGS.whatsappMessage,
    shippingMethods: (shipping["methods"] as ShippingMethod[]) ?? DEFAULT_SETTINGS.shippingMethods,
    freeShippingThreshold:
      (shipping["freeShippingThreshold"] as number) ?? DEFAULT_SETTINGS.freeShippingThreshold,
    freeShippingEnabled:
      (shipping["freeShippingEnabled"] as boolean) ?? DEFAULT_SETTINGS.freeShippingEnabled,
    paymentMethods: (payments["methods"] as PaymentOption[]) ?? DEFAULT_SETTINGS.paymentMethods,
    pages: {
      quemSomos: (pages["quemSomos"] as PageContent) ?? DEFAULT_SETTINGS.pages.quemSomos,
      nossaMissao: (pages["nossaMissao"] as PageContent) ?? DEFAULT_SETTINGS.pages.nossaMissao,
      formasPagamento:
        (pages["formasPagamento"] as PageContent) ?? DEFAULT_SETTINGS.pages.formasPagamento,
      trocasDevolucoes:
        (pages["trocasDevolucoes"] as PageContent) ?? DEFAULT_SETTINGS.pages.trocasDevolucoes,
      politicaPrivacidade:
        (pages["politicaPrivacidade"] as PageContent) ?? DEFAULT_SETTINGS.pages.politicaPrivacidade,
    },
    promoMessage: DEFAULT_SETTINGS.promoMessage,
    imageProvider,
  };
}

/* ------------------------------------------------------------------ */
/* Admin CRUD                                                          */
/* ------------------------------------------------------------------ */

export async function adminInsertProduct(
  product: Product,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("products").insert({
    category_id: product.categoryId,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    compare_at_price: product.compareAtPrice,
    image_url: product.imageUrl,
    gallery: product.gallery,
    stock: product.stock,
    minimum_stock: product.minimumStock,
    barcode: product.barcode,
    unit_label: product.unitLabel,
    is_active: product.isActive,
    is_best_seller: product.isBestSeller,
    sales_count: product.salesCount,
    badges: product.badges,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminUpdateProduct(
  product: Product,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("products")
    .update({
      category_id: product.categoryId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      compare_at_price: product.compareAtPrice,
      image_url: product.imageUrl,
      gallery: product.gallery,
      stock: product.stock,
      minimum_stock: product.minimumStock,
      barcode: product.barcode,
      unit_label: product.unitLabel,
      is_active: product.isActive,
      is_best_seller: product.isBestSeller,
      sales_count: product.salesCount,
      badges: product.badges,
    })
    .eq("id", product.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminDeleteProduct(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminInsertCategory(
  category: Category,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("categories").insert({
    slug: category.slug,
    name: category.name,
    description: category.description,
    image_url: category.imageUrl,
    sort_order: category.sortOrder,
    is_active: category.isActive,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminUpdateCategory(
  category: Category,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("categories")
    .update({
      slug: category.slug,
      name: category.name,
      description: category.description,
      image_url: category.imageUrl,
      sort_order: category.sortOrder,
      is_active: category.isActive,
    })
    .eq("id", category.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminDeleteCategory(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminInsertBanner(banner: Banner): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("banners").insert({
    title: banner.title,
    subtitle: banner.subtitle,
    image_url: banner.imageUrl,
    button_text: banner.buttonText,
    link_url: banner.linkUrl,
    sort_order: banner.sortOrder,
    is_active: banner.isActive,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminUpdateBanner(banner: Banner): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("banners")
    .update({
      title: banner.title,
      subtitle: banner.subtitle,
      image_url: banner.imageUrl,
      button_text: banner.buttonText,
      link_url: banner.linkUrl,
      sort_order: banner.sortOrder,
      is_active: banner.isActive,
    })
    .eq("id", banner.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminDeleteBanner(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Configurações do site (Admin)                                       */
/* ------------------------------------------------------------------ */

export async function adminUpdateSiteSettings(
  key:
    | "identity"
    | "contact"
    | "social"
    | "whatsapp"
    | "pages"
    | "imageProvider"
    | "shipping"
    | "payments",
  value: unknown,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from("site_settings")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) return { ok: false, error: (error as any).message ?? "Erro desconhecido" };
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Upload de imagens (Supabase Storage)                                 */
/* ------------------------------------------------------------------ */

export async function uploadProductImage(
  file: File,
  productId: string,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const fileName = `${productId}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(fileName, file, { upsert: true });
  if (uploadError) return { ok: false, error: (uploadError as any).message ?? "Erro no upload" };

  const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
  return { ok: true, url: data.publicUrl ?? "" };
}

export async function uploadSiteImage(
  file: File,
  folder: "banners" | "general" = "general",
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const fileName = `${folder}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("site-images")
    .upload(fileName, file, { upsert: true });
  if (uploadError) return { ok: false, error: (uploadError as any).message ?? "Erro no upload" };

  const { data } = supabase.storage.from("site-images").getPublicUrl(fileName);
  return { ok: true, url: data.publicUrl ?? "" };
}

export async function deleteProductImage(url: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const fileName = pathParts[pathParts.length - 1] ?? "";
    const { error } = await supabase.storage.from("product-images").remove([fileName]);
    if (error) {
      const msg = (error as any).message;
      return { ok: false, error: msg ?? "Erro desconhecido" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "URL inválida" };
  }
}

export async function deleteSiteImage(url: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const fileName = pathParts.slice(pathParts.indexOf("site-images") + 1).join("/");
    const { error } = await supabase.storage.from("site-images").remove([fileName]);
    if (error) {
      const msg = (error as any).message;
      return { ok: false, error: msg ?? "Erro desconhecido" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "URL inválida" };
  }
}

export async function fetchImageProvider(): Promise<ImageProvider> {
  try {
    const settings = await fetchSiteSettings();
    return settings.imageProvider ?? { cloudName: "", uploadPreset: "", folder: "produtos" };
  } catch {
    return { cloudName: "", uploadPreset: "", folder: "produtos" };
  }
}

/**
 * Envia uma imagem para o Cloudinary (upload direto do navegador),
 * de forma não fixa: lê as configurações salvas no banco (cloud_name,
 * upload_preset e pasta). Retorna a URL otimizada da imagem.
 */
export async function uploadCloudinaryImage(
  file: File,
  folder: string,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const provider = await fetchImageProvider();
  if (!provider.cloudName || !provider.uploadPreset) {
    return { ok: false, error: "Cloudinary não configurado." };
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", provider.uploadPreset);
  if (folder) form.append("folder", folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${provider.cloudName}/image/upload`;

  try {
    const response = await fetch(endpoint, { method: "POST", body: form });
    if (!response.ok) {
      return { ok: false, error: `Cloudinary devolveu erro ${response.status}` };
    }
    const data = await response.json();
    const url = data["secure_url"] as string | undefined;
    if (!url) return { ok: false, error: "Cloudinary não retornou a URL." };
    return { ok: true, url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao enviar para o Cloudinary";
    return { ok: false, error: msg };
  }
}

/**
 * Função central de upload de imagens. Decide dinamicamente:
 * 1. Se o Cloudinary estiver configurado -> usa Cloudinary.
 * 2. Caso contrário -> usa o Supabase Storage e, se falhar, salva em base64.
 * Assim não fica fixo no projeto e funciona em qualquer uma das opções.
 */
export async function uploadImage(
  file: File,
  opts: { kind: "product" | "site"; productId?: string; folder?: string } = { kind: "site" },
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const provider = await fetchImageProvider();

  if (provider.cloudName && provider.uploadPreset) {
    return uploadCloudinaryImage(file, opts.folder || provider.folder);
  }

  if (opts.kind === "product" && opts.productId) {
    return uploadProductImage(file, opts.productId);
  }
  return uploadSiteImage(file, (opts.folder as "banners" | "general") || "general");
}

export async function adminFetchAll(): Promise<{
  products: Product[];
  categories: Category[];
  banners: Banner[];
  instagramPosts: InstagramPost[];
  orders: Order[];
}> {
  const [
    { data: products },
    { data: categories },
    { data: banners },
    { data: instagramPosts },
    { data: orders },
  ] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }),
    supabase.from("categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("banners").select("*").order("sort_order", { ascending: true }),
    supabase.from("instagram_posts").select("*").order("sort_order", { ascending: true }),
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
  ]);
  return {
    products: (products ?? []).map((row) => mapProduct(row as Record<string, unknown>)),
    categories: (categories ?? []).map((row) => mapCategory(row as Record<string, unknown>)),
    banners: (banners ?? []).map((row) => mapBanner(row as Record<string, unknown>)),
    instagramPosts: (instagramPosts ?? []).map((row) =>
      mapInstagramPost(row as Record<string, unknown>),
    ),
    orders: (orders ?? []).map((row) => mapOrder(row as Record<string, unknown>)),
  };
}

/* ------------------------------------------------------------------ */
/* Clientes (PDV / Admin)                                              */
/* ------------------------------------------------------------------ */

// Nota: a tabela "customers" será tipada automaticamente após
// aplicar a migration 0008 no Supabase e regerar os tipos.
// Enquanto isso, usamos casts nos calls ao Supabase.

export async function adminFetchCustomers(): Promise<Customer[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from as any)("customers")
    .select("*")
    .order("name", { ascending: true });
  return (data ?? []).map((row: Record<string, unknown>) => mapCustomer(row));
}

export async function adminSaveCustomer(
  customer: Omit<Customer, "createdAt" | "updatedAt">,
): Promise<{ ok: boolean; error?: string }> {
  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("customers").upsert({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    document: customer.document,
    zip_code: customer.zipCode,
    address: customer.address,
    number: customer.number,
    complement: customer.complement,
    neighborhood: customer.neighborhood,
    city: customer.city,
    state: customer.state,
    notes: customer.notes,
    updated_at: now,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminDeleteCustomer(id: string): Promise<{ ok: boolean; error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("customers").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
