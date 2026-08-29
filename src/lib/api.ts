import { supabase } from "@/integrations/supabase/client";
import type { Banner, Category, InstagramPost, Order, Product, ProductWithCategory, SiteSettings, SocialLink } from "./types";

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
  return {
    id: String(row["id"]),
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

/* ------------------------------------------------------------------ */
/* Pedidos                                                             */
/* ------------------------------------------------------------------ */

export async function saveOrder(order: Order): Promise<{ ok: boolean }> {
  const ownerId = (await supabase.auth.getUser().catch(() => null))?.data?.user?.id ?? null;

  const { error } = await supabase.from("orders").insert({
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
    .in("key", ["identity", "contact", "social", "whatsapp"]);

  if (error) {
    const { DEFAULT_SETTINGS } = await import("./constants");
    return DEFAULT_SETTINGS;
  }

  const settings: Record<string, unknown> = {};
  (data ?? []).forEach((row: Record<string, unknown>) => {
    settings[row["key"] as string] = row["value"];
  });

  const identity = (settings["identity"] as Record<string, string>) ?? {};
  const contact = (settings["contact"] as Record<string, string>) ?? {};
  const social = (settings["social"] as SocialLink[]) ?? [];
  const whatsapp = (settings["whatsapp"] as Record<string, string>) ?? {};

  const { DEFAULT_SETTINGS } = await import("./constants");

  return {
    name: identity["name"] ?? DEFAULT_SETTINGS.name ?? "PASSARELLI DOCES",
    tagline: identity["tagline"] ?? DEFAULT_SETTINGS.tagline ?? "Doces especiais para momentos especiais",
    primaryColor: identity["primaryColor"] ?? "#2a1510",
    secondaryColor: identity["secondaryColor"] ?? "#c9a84c",
    email: contact["email"] ?? DEFAULT_SETTINGS.email,
    phone: contact["phone"] ?? DEFAULT_SETTINGS.phone,
    whatsapp: contact["whatsapp"] ?? DEFAULT_SETTINGS.whatsapp,
    address: contact["address"] ?? DEFAULT_SETTINGS.address,
    hours: contact["hours"] ?? DEFAULT_SETTINGS.hours,
    mapUrl: contact["mapUrl"] ?? "",
    social,
    whatsappNumber: whatsapp["number"] ?? DEFAULT_SETTINGS.whatsapp,
    whatsappMessage: whatsapp["defaultMessage"] ?? "Olá! Gostaria de fazer um pedido 🍬",
    promoMessage: DEFAULT_SETTINGS.promoMessage,
  };
}

/* ------------------------------------------------------------------ */
/* Admin CRUD                                                          */
/* ------------------------------------------------------------------ */

export async function adminInsertProduct(product: Product): Promise<{ ok: boolean; error?: string }> {
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
    is_active: product.isActive,
    is_best_seller: product.isBestSeller,
    sales_count: product.salesCount,
    badges: product.badges,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminUpdateProduct(product: Product): Promise<{ ok: boolean; error?: string }> {
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

export async function adminInsertCategory(category: Category): Promise<{ ok: boolean; error?: string }> {
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

export async function adminUpdateCategory(category: Category): Promise<{ ok: boolean; error?: string }> {
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
  key: "identity" | "contact" | "social" | "whatsapp",
  value: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from("site_settings")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function adminFetchAll(): Promise<{
  products: Product[];
  categories: Category[];
  banners: Banner[];
}> {
  const [{ data: products }, { data: categories }, { data: banners }] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }),
    supabase.from("categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("banners").select("*").order("sort_order", { ascending: true }),
  ]);
  return {
    products: (products ?? []).map((row) => mapProduct(row as Record<string, unknown>)),
    categories: (categories ?? []).map((row) => mapCategory(row as Record<string, unknown>)),
    banners: (banners ?? []).map((row) => mapBanner(row as Record<string, unknown>)),
  };
}
