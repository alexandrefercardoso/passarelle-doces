import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartOff, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/store/empty-state";
import { ProductCard } from "@/components/store/product-card";
import { ProductGridSkeleton } from "@/components/store/skeleton";
import { useProducts } from "@/hooks/use-store-data";
import { useWishlist } from "@/hooks/use-wishlist";

export const Route = createFileRoute("/_store/favoritos")({
  component: FavoritesPage,
  head: () => ({
    meta: [{ title: "Meus Favoritos — Passarelli Doces" }],
  }),
});

function FavoritesPage() {
  const { ids } = useWishlist();
  const { data, isLoading } = useProducts();

  const favorites = (data ?? []).filter((p) => ids.includes(p.id) && p.isActive);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
        Meus Favoritos
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {favorites.length > 0
          ? `${favorites.length} ${favorites.length === 1 ? "docinho guardado" : "docinhos guardados"} com carinho.`
          : "Guarde aqui as delícias que você mais ama."}
      </p>

      <div className="mt-8">
        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {favorites.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={HeartOff}
            title="Nenhum favorito ainda"
            description="Toque no coração de um produto para guardá-lo aqui e voltar a ele quando quiser."
            action={
              <Button asChild className="rounded-full">
                <Link to="/produtos">
                  <ShoppingBag className="h-4 w-4" />
                  Explorar produtos
                </Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
