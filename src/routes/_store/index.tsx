import { createFileRoute } from "@tanstack/react-router";
import {
  useBanners,
  useBestSellers,
  useCategories,
  useInstagramPosts,
  useOnSaleProducts,
} from "@/hooks/use-store-data";
import { CategoryCard } from "@/components/store/category-card";
import { ErrorState } from "@/components/store/error-state";
import { HeroBanner } from "@/components/store/hero-banner";
import { InstagramSection } from "@/components/store/instagram-section";
import { ProductCard } from "@/components/store/product-card";
import { PromotionsSection } from "@/components/store/promotions-section";
import { BannerSkeleton, ProductGridSkeleton, SectionSkeleton } from "@/components/store/skeleton";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_store/")({
  component: HomePage,
  head: () => ({
    meta: [
      {
        title: "Passarelli Doces — Doces artesanais e chocolates especiais",
      },
      {
        name: "description",
        content:
          "Loja online de doces da Passarelli Doces: brigadeiros gourmet, trufas, chocolates, bolos e kits de festa. Encomende com carinho e receba no conforto da sua casa.",
      },
    ],
  }),
});

function HomePage() {
  const banners = useBanners();
  const categories = useCategories();
  const bestSellers = useBestSellers();
  const onSale = useOnSaleProducts();
  const instagram = useInstagramPosts();

  const highlightCategories = (categories.data ?? []).filter((c) =>
    ["chocolates", "doces-gourmet", "presentes", "festas"].includes(c.slug),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6">
      {/* 5. BANNER PRINCIPAL */}
      {banners.isLoading ? (
        <BannerSkeleton />
      ) : banners.isError ? (
        <ErrorState onRetry={() => void banners.refetch()} />
      ) : banners.data && banners.data.length > 0 ? (
        <HeroBanner banners={banners.data} />
      ) : null}

      {/* 6. CATEGORIAS EM DESTAQUE */}
      <section className="mt-16" aria-label="Categorias em destaque">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blush text-rose">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Categorias em Destaque
          </h2>
        </div>

        {categories.isLoading ? (
          <div className="mt-8">
            <SectionSkeleton />
          </div>
        ) : categories.isError ? (
          <div className="mt-8">
            <ErrorState onRetry={() => void categories.refetch()} />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {highlightCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </section>

      {/* 7. MAIS VENDIDOS */}
      <section className="mt-16" aria-label="Os queridinhos da Passarelli">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-gold-dark">
              Sugestões especiais
            </p>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Os queridinhos da Passarelli
            </h2>
          </div>
          <a href="/produtos" className="text-sm font-semibold text-gold-dark hover:underline">
            Ver todos →
          </a>
        </div>

        <div className="mt-8">
          {bestSellers.isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : bestSellers.isError ? (
            <ErrorState onRetry={() => void bestSellers.refetch()} />
          ) : bestSellers.data && bestSellers.data.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {bestSellers.data.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* 8. PROMOÇÕES */}
      <PromotionsSection
        className="mt-16"
        products={onSale.data}
        isLoading={onSale.isLoading}
        isError={onSale.isError}
        onRetry={() => void onSale.refetch()}
      />

      {/* 10. INSTAGRAM */}
      <div className="mt-16">
        <InstagramSection posts={instagram.data} isLoading={instagram.isLoading} />
      </div>
    </div>
  );
}
