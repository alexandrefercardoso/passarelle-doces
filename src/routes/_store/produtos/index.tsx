import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, PackageSearch, SlidersHorizontal } from "lucide-react";
import { useCategories, useProducts, useSiteSettings } from "@/hooks/use-store-data";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/store/empty-state";
import { ErrorState } from "@/components/store/error-state";
import { ProductCard } from "@/components/store/product-card";
import { ProductGridSkeleton } from "@/components/store/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = "relevancia" | "menor-preco" | "maior-preco" | "mais-vendidos" | "desconto";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "relevancia", label: "Relevância" },
  { value: "mais-vendidos", label: "Mais vendidos" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
  { value: "desconto", label: "Maior desconto" },
];

export const Route = createFileRoute("/_store/produtos/")({
  validateSearch: (search: Record<string, unknown>): { q?: string; categoria?: string } => {
    const result: { q?: string; categoria?: string } = {};
    if (typeof search["q"] === "string") result.q = search["q"];
    if (typeof search["categoria"] === "string") result.categoria = search["categoria"];
    return result;
  },
  component: ProductsPage,
  head: () => ({
    meta: [
      { title: "Todos os Produtos — Passarelli Doces" },
      {
        name: "description",
        content:
          "Confira todos os doces da Passarelli Doces: brigadeiros, trufas, chocolates, bolos e kits de festa com preços especiais.",
      },
    ],
  }),
});

function ProductsPage() {
  const { q, categoria } = Route.useSearch();
  const [sort, setSort] = useState<SortOption>("relevancia");
  const products = useProducts();
  const categories = useCategories();
  const { data: settings } = useSiteSettings();

  const visibleCategories = (categories.data ?? []).filter((c) => c.isActive);

  const filtered = useMemo(() => {
    let list = products.data ?? [];
    if (categoria) {
      list = list.filter((p) => p.category?.slug === categoria);
    }
    if (q) {
      const term = q.trim().toLowerCase();
      if (term) {
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term) ||
            (p.category?.name.toLowerCase().includes(term) ?? false),
        );
      }
    }
    list = list.filter((p) => p.isActive);

    switch (sort) {
      case "menor-preco":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "maior-preco":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "mais-vendidos":
        list = [...list].sort((a, b) => b.salesCount - a.salesCount);
        break;
      case "desconto":
        list = [...list].sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0));
        break;
      default:
        list = [...list].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    }
    return list;
  }, [products.data, categoria, q, sort]);

  const activeCategory = visibleCategories.find((c) => c.slug === categoria);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="rounded-2xl bg-gradient-to-br from-cream to-blush px-6 py-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold-dark">
          Catálogo Passarelli
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-foreground">
          {activeCategory ? activeCategory.name : "Todos os Produtos"}
        </h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          {q
            ? `Resultados para “${q}”`
            : "Doces artesanais feitos com carinho para adoçar o seu dia."}
        </p>
      </div>

      {/* Banner da página de produtos (se configurado) */}
      {settings?.productsPageBanner && (
        <div className="mt-6 rounded-2xl overflow-hidden">
          <img
            src={settings.productsPageBanner}
            alt={settings.productsPageBannerAlt || "Banner da página de produtos"}
            className="w-full h-auto object-cover max-h-[300px]"
          />
        </div>
      )}

      {/* Filtro por categoria */}
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
        <FilterChip
          active={!categoria}
          onClick={() => {}}
          label="Todos"
          to="/produtos"
          search={{}}
        />
        {visibleCategories.map((c) => (
          <FilterChip
            key={c.id}
            active={c.slug === categoria}
            label={c.name}
            to="/produtos"
            search={{ categoria: c.slug }}
          />
        ))}
      </div>

      {/* Barra de ordenação */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {products.isLoading ? (
            "Carregando..."
          ) : (
            <>
              <strong className="text-foreground">{filtered.length}</strong>{" "}
              {filtered.length === 1 ? "produto" : "produtos"}
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden />
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-[180px] rounded-full">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid de produtos */}
      <div className="mt-6">
        {products.isLoading ? (
          <ProductGridSkeleton count={12} />
        ) : products.isError ? (
          <ErrorState onRetry={() => void products.refetch()} />
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={PackageSearch}
            title="Nenhum produto encontrado"
            description="Tente ajustar a busca ou explorar uma categoria diferente."
            action={
              <Button asChild variant="outline" className="rounded-full">
                <Link
                  to="/produtos"
                  search={{}}
                  onClick={() => {
                    // limpa filtros
                  }}
                >
                  Limpar filtros
                </Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  label,
  to,
  search,
  onClick,
}: {
  active: boolean;
  label: string;
  to: string;
  search?: Record<string, string>;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to as never}
      {...(search ? { search: search as never } : {})}
      {...(onClick ? { onClick } : {})}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-chocolate bg-chocolate text-cream shadow-sm"
          : "border-border bg-card text-muted-foreground hover:border-gold hover:text-chocolate-dark",
      )}
    >
      {label}
      {active && <ChevronDown className="h-3.5 w-3.5 rotate-180" />}
    </Link>
  );
}
