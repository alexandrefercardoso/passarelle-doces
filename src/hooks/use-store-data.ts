"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  fetchAllOrders,
  fetchBanners,
  fetchBestSellers,
  fetchCategories,
  fetchInstagramPosts,
  fetchOnSaleProducts,
  fetchOrders,
  fetchProductBySlug,
  fetchProducts,
  searchProducts,
} from "@/lib/api";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBestSellers() {
  return useQuery({
    queryKey: ["products", "best-sellers"],
    queryFn: fetchBestSellers,
    staleTime: 5 * 60 * 1000,
  });
}

export function useOnSaleProducts() {
  return useQuery({
    queryKey: ["products", "on-sale"],
    queryFn: fetchOnSaleProducts,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ["products", "slug", slug],
    queryFn: () => fetchProductBySlug(slug),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBanners() {
  return useQuery({
    queryKey: ["banners"],
    queryFn: fetchBanners,
    staleTime: 5 * 60 * 1000,
  });
}

export function useInstagramPosts() {
  return useQuery({
    queryKey: ["instagram"],
    queryFn: fetchInstagramPosts,
    staleTime: 10 * 60 * 1000,
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
    staleTime: 60 * 1000,
  });
}

export function useAllOrders() {
  return useQuery({
    queryKey: ["all-orders"],
    queryFn: fetchAllOrders,
    staleTime: 30 * 1000,
  });
}

export function useSearchProducts(query: string) {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ["products", "search", debounced.trim().toLowerCase()],
    queryFn: () => searchProducts(debounced),
    enabled: debounced.trim().length >= 2,
    staleTime: 30 * 1000,
  });
}
