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
import {
  loadUserWishlist,
  persistLocalWishlist,
  readLocalWishlist,
  syncWishlistWithUser,
} from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

type WishlistContextValue = {
  ids: string[];
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readLocalWishlist());
  }, []);

  useEffect(() => {
    persistLocalWishlist(ids);
    void syncWishlistWithUser(ids);
  }, [ids]);

  useEffect(() => {
    const loadRemote = async () => {
      const remote = await loadUserWishlist().catch(() => []);
      if (remote.length > 0) {
        setIds((prev) => Array.from(new Set([...prev, ...remote])));
      }
    };
    void loadRemote();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void loadRemote();
      }
      if (event === "SIGNED_OUT") {
        setIds(readLocalWishlist());
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const toggle = useCallback((productId: string) => {
    setIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  }, []);

  const has = useCallback((productId: string) => ids.includes(productId), [ids]);

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo(() => ({ ids, toggle, has, clear }), [ids, toggle, has, clear]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist deve ser usado dentro de <WishlistProvider>");
  return ctx;
}
