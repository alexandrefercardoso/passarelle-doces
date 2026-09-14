"use client";

import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Search, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchProducts } from "@/hooks/use-store-data";
import { formatCurrency } from "@/lib/format";
import { ProductImage } from "./product-image";

export function SearchBox({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data, isFetching } = useSearchProducts(query);

  const showResults = open && query.trim().length >= 2;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate({ to: "/produtos", search: { q: query.trim() } });
    setOpen(false);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <form onSubmit={submit} role="search">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Buscar doces, chocolates, bolos..."
            className="h-11 w-full rounded-full border border-border bg-cream/70 pl-10 pr-20 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-gold focus:bg-background focus:ring-2 focus:ring-gold/30"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-full bg-chocolate px-4 text-xs font-semibold text-cream transition-colors hover:bg-chocolate-dark"
          >
            Buscar
          </button>
        </div>
      </form>

      {showResults && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-chocolate/10">
          <div className="max-h-96 overflow-y-auto p-2">
            {isFetching ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </div>
            ) : data && data.length > 0 ? (
              <>
                <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Resultados
                </p>
                {data.map((p) => (
                  <Link
                    key={p.id}
                    to="/produtos/$slug"
                    params={{ slug: p.slug }}
                    onMouseDown={(e) => e.preventDefault()}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-blush"
                  >
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-cream">
                      <ProductImage src={p.imageUrl} alt={p.name} emoji="🧁" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category?.name}</p>
                    </div>
                    <div className="text-sm font-semibold text-chocolate-dark">
                      {formatCurrency(p.price)}
                      {p.unitLabel && (
                        <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                          /{p.unitLabel}
                        </span>
                      )}
                      {p.compareAtPrice && p.compareAtPrice > p.price && (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground line-through">
                          {formatCurrency(p.compareAtPrice)}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
                <Link
                  to="/produtos"
                  search={{ q: query.trim() }}
                  className="mt-1 block rounded-xl px-3 py-2.5 text-center text-sm font-semibold text-gold-dark transition-colors hover:bg-cream"
                >
                  Ver todos os resultados →
                </Link>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <SearchX className="h-6 w-6 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium text-foreground">Nada encontrado</p>
                <p className="text-xs text-muted-foreground">
                  Tente buscar por &quot;brigadeiro&quot;, &quot;trufa&quot; ou &quot;bolo&quot;
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
