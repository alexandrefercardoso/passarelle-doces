import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgePercent } from "lucide-react";
import { useOnSaleProducts } from "@/hooks/use-store-data";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/store/empty-state";
import { ErrorState } from "@/components/store/error-state";
import { ProductCard } from "@/components/store/product-card";
import { ProductGridSkeleton } from "@/components/store/skeleton";

export const Route = createFileRoute("/_store/promocoes")({
  component: PromotionsPage,
  head: () => ({
    meta: [
      { title: "Promoções — Passarelli Doces" },
      {
        name: "description",
        content:
          "Aproveite as promoções da Passarelli Doces: descontos em trufas, brigadeiros gourmet, bolos e kits de festa por tempo limitado.",
      },
    ],
  }),
});

function PromotionsPage() {
  const { data, isLoading, isError, refetch } = useOnSaleProducts();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="rounded-3xl bg-gradient-to-br from-destructive/10 via-blush to-cream px-6 py-10 sm:px-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
          <BadgePercent className="h-4 w-4" />
          Ofertas por tempo limitado
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Promoções Especiais
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Os nossos queridinhos com desconto, economia garantida e o mesmo carinho de sempre.
        </p>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : data && data.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sem promoções no momento"
            description="As ofertas estão sendo renovadas com muito carinho. Volte em breve!"
            action={
              <Button asChild className="rounded-full">
                <Link to="/produtos">Ver todos os produtos</Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
