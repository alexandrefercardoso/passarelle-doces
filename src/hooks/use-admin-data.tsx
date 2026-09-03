"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { adminFetchAll } from "@/lib/api";
import type { Banner, Category, InstagramPost, Product } from "@/lib/types";

type AdminDataContextValue = {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  instagramPosts: InstagramPost[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [instagramPosts, setInstagramPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminFetchAll();
      setProducts(result.products);
      setCategories(result.categories);
      setBanners(result.banners);
      setInstagramPosts(result.instagramPosts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ products, categories, banners, instagramPosts, loading, refresh }),
    [products, categories, banners, instagramPosts, loading, refresh],
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData(): AdminDataContextValue {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData deve ser usado dentro de <AdminDataProvider>");
  return ctx;
}
