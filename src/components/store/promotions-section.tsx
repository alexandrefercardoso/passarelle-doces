import { Link } from "@tanstack/react-router";
import { BadgePercent } from "lucide-react";
import type { ProductWithCategory } from "@/lib/types";
import { ProductCard } from "./product-card";
import { ErrorState } from "./error-state";
import { ProductGridSkeleton } from "./skeleton";

type PromotionsSectionProps = {
  products: ProductWithCategory[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
  className?: string;
};

export function PromotionsSection({
  products,
  isLoading,
  isError,
  onRetry,
  className,
}: PromotionsSectionProps) {
  return (
    <section className={className} aria-label="Promoções especiais">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <BadgePercent className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Promoções Especiais
            </h3>
            <p className="text-sm text-muted-foreground">Ofertas por tempo limitado. Aproveite!</p>
          </div>
        </div>
        <Link
          to="/promocoes"
          className="inline-flex items-center gap-1 text-sm font-semibold text-gold-dark hover:underline"
        >
          Ver todas as promoções →
        </Link>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : isError ? (
          onRetry ? (
            <ErrorState onRetry={onRetry} />
          ) : (
            <ErrorState />
          )
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
