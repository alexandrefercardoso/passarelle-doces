import { Link } from "@tanstack/react-router";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { cleanCategorySlug } from "@/lib/navigation";
import { Price } from "./price";
import { ProductImage } from "./product-image";
import type { ProductWithCategory } from "@/lib/types";

type ProductCardProps = {
  product: ProductWithCategory;
  className?: string;
  showQuickView?: boolean;
};

export function ProductCard({ product, className, showQuickView = true }: ProductCardProps) {
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const isFavorite = has(product.id);
  const isSale = !!product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-chocolate/10",
        className,
      )}
    >
      <Link
        to="/produtos/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-square overflow-hidden bg-cream"
      >
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          emoji="🧁"
          className="transition-transform duration-500 group-hover:scale-105"
          sizes="(min-width: 1024px) 25vw, 50vw"
        />

        {isSale && (
          <span className="absolute left-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            PROMO
          </span>
        )}
        {product.isBestSeller && (
          <span className="absolute right-3 top-3 rounded-full bg-gold px-2.5 py-1 text-xs font-bold text-chocolate-dark shadow-sm">
            ★ Mais Vendido
          </span>
        )}
        {product.badges
          .filter((b) => b !== "Promoção" && b !== "Mais Vendido")
          .slice(0, 1)
          .map((badge) => (
            <span
              key={badge}
              className="absolute left-3 top-3 rounded-full border border-gold/40 bg-background/90 px-2.5 py-1 text-xs font-semibold text-chocolate-dark backdrop-blur"
            >
              {badge}
            </span>
          ))}
      </Link>

      <button
        type="button"
        onClick={() => toggle(product.id)}
        className={cn(
          "absolute right-3 top-12 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 shadow-sm backdrop-blur transition-all hover:scale-105",
          isFavorite ? "text-rose hover:text-rose" : "text-muted-foreground hover:text-rose",
        )}
        aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        <Heart className={cn("h-4 w-4", isFavorite && "fill-rose text-rose")} />
      </button>

      <div className="flex flex-1 flex-col p-4">
        <Link
          to="/categoria/$slug"
          params={{
            slug: product.category?.slug ?? cleanCategorySlug(product.categoryId),
          }}
          className="text-xs font-medium text-gold-dark hover:underline"
        >
          {product.category?.name ?? "Doces"}
        </Link>

        <Link
          to="/produtos/$slug"
          params={{ slug: product.slug }}
          className="mt-1 line-clamp-2 font-display text-base font-semibold text-foreground leading-snug hover:text-chocolate-dark"
        >
          {product.name}
        </Link>

        <div className="mt-2">
          <Price
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            unitLabel={product.unitLabel}
            size="md"
          />
        </div>

        <div className="mt-auto flex items-center gap-2 pt-3">
          <Button size="sm" className="flex-1 rounded-full" onClick={() => addItem(product)}>
            <ShoppingBag className="h-4 w-4" />
            Adicionar
          </Button>
          {showQuickView && (
            <Button
              size="icon"
              variant="outline"
              className="rounded-full"
              aria-label="Ver produto"
              asChild
            >
              <Link to="/produtos/$slug" params={{ slug: product.slug }}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
