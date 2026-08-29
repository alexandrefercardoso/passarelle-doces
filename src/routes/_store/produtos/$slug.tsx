import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { useProductBySlug, useProducts } from "@/hooks/use-store-data";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { EmptyState } from "@/components/store/empty-state";
import { ErrorState } from "@/components/store/error-state";
import { Price } from "@/components/store/price";
import { ProductCard } from "@/components/store/product-card";
import { ProductCardSkeleton, ProductGridSkeleton } from "@/components/store/skeleton";
import { ProductImage } from "@/components/store/product-image";

export const Route = createFileRoute("/_store/produtos/$slug")({
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const { data: product, isLoading, isError, refetch } = useProductBySlug(slug);
  const { data: allProducts } = useProducts();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();

  const related = useMemo(() => {
    if (!product || !allProducts) return [];
    return allProducts
      .filter((p) => p.categoryId === product.categoryId && p.id !== product.id && p.isActive)
      .slice(0, 4);
  }, [product, allProducts]);

  if (isLoading) return <ProductDetailSkeleton />;
  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <ErrorState onRetry={() => void refetch()} />
      </div>
    );
  }
  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Produto não encontrado"
          description="O produto que você procura não está mais disponível."
          action={
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/produtos">Ver todos os produtos</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const isFavorite = has(product.id);
  const isSale = !!product.compareAtPrice && product.compareAtPrice > product.price;
  const gallery = product.gallery.length > 0 ? product.gallery : [product.imageUrl];

  const handleAdd = () => {
    addItem(product, quantity);
    toast.success("Adicionado ao carrinho", {
      description: `${quantity}× ${product.name}`,
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Início</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/produtos">Produtos</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {product.category && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/categoria/$slug" params={{ slug: product.category.slug }}>
                    {product.category.name}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Galeria */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-cream">
            <ProductImage
              src={gallery[activeImage] ?? product.imageUrl}
              alt={product.name}
              emoji="🍰"
              className="rounded-3xl"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            {isSale && (
              <span className="absolute left-4 top-4 rounded-full bg-destructive px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                PROMO
              </span>
            )}
            {product.isBestSeller && (
              <span className="absolute right-4 top-4 rounded-full bg-gold px-3 py-1.5 text-xs font-bold text-chocolate-dark shadow-sm">
                ★ Mais Vendido
              </span>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "h-20 w-20 overflow-hidden rounded-xl border-2 transition-all",
                    activeImage === i
                      ? "border-gold"
                      : "border-transparent opacity-70 hover:opacity-100",
                  )}
                  aria-label={`Ver imagem ${i + 1}`}
                >
                  <ProductImage src={img} alt={`${product.name} imagem ${i + 1}`} emoji="🍰" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="flex flex-col">
          {product.category && (
            <Link
              to="/categoria/$slug"
              params={{ slug: product.category.slug }}
              className="text-sm font-semibold text-gold-dark hover:underline"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3">
            <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
            {isSale && product.compareAtPrice && (
              <p className="mt-1 text-xs text-muted-foreground">
                Você economiza{" "}
                <strong className="text-destructive">
                  {formatCurrency(product.compareAtPrice - product.price)}
                </strong>{" "}
                nesta compra
              </p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {product.badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-gold/40 bg-gold-soft px-3 py-1 text-xs font-semibold text-chocolate-dark"
              >
                {badge}
              </span>
            ))}
          </div>

          <p className="mt-5 max-w-prose whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          {/* Estoque */}
          <div className="mt-4 text-sm">
            {product.stock > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-chocolate-dark">
                <Check className="h-4 w-4 text-gold-dark" />
                Em estoque — pronto para envio
              </span>
            ) : (
              <span className="font-medium text-destructive">Produto sob encomenda</span>
            )}
          </div>

          {/* Quantidade + CTA */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex h-12 items-center gap-1 rounded-full border border-border bg-card">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                aria-label="Diminuir quantidade"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                aria-label="Aumentar quantidade"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button
              className="h-12 flex-1 rounded-full text-base font-semibold sm:flex-none sm:px-8"
              onClick={handleAdd}
            >
              <ShoppingBag className="h-5 w-5" />
              Adicionar ao carrinho
            </Button>

            <Button
              variant={isFavorite ? "default" : "outline"}
              className="h-12 w-12 rounded-full"
              onClick={() => toggle(product.id)}
              aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Heart className={cn("h-5 w-5", isFavorite && "fill-white/90")} />
            </Button>
          </div>

          {/* Garantias */}
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Benefit
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Compra segura"
              text="Dados protegidos e PIX com confirmação imediata"
            />
            <Benefit
              icon={<Truck className="h-5 w-5" />}
              title="Entrega caprichada"
              text="Embalagem que mantém seus doces intactos"
            />
          </div>
        </div>
      </div>

      {/* Relacionados */}
      {related.length > 0 && (
        <section className="mt-16" aria-label="Você também pode gostar">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
              Você também pode gostar
            </h2>
            <Link
              to="/produtos"
              className="inline-flex items-center gap-1 text-sm font-semibold text-gold-dark hover:underline"
            >
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Benefit({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
      <span className="text-gold-dark">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="h-4 w-64 animate-pulse rounded-full bg-muted" />
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="aspect-square animate-pulse rounded-3xl bg-muted" />
        <div className="space-y-4">
          <div className="h-3 w-28 animate-pulse rounded-full bg-muted" />
          <div className="h-9 w-3/4 animate-pulse rounded-xl bg-muted" />
          <div className="h-8 w-40 animate-pulse rounded-xl bg-muted" />
          <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-12 w-full animate-pulse rounded-full bg-muted" />
        </div>
      </div>
      <div className="mt-16">
        <div className="h-7 w-64 animate-pulse rounded-xl bg-muted" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </div>
      </div>
    </div>
  );
}
