import { createFileRoute, Link } from "@tanstack/react-router";
import { useProducts } from "@/hooks/use-store-data";
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
import { ProductCard } from "@/components/store/product-card";
import { ProductGridSkeleton } from "@/components/store/skeleton";
import { ProductImage } from "@/components/store/product-image";

export const Route = createFileRoute("/_store/categoria/$slug")({
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data, isLoading, isError, refetch } = useProducts();

  const products = (data ?? []).filter((p) => p.category?.slug === slug && p.isActive);
  const category = products[0]?.category ?? null;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="h-8 w-64 animate-pulse rounded-2xl bg-muted" />
        <div className="mt-8">
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <ErrorState onRetry={() => void refetch()} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
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
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{category?.name ?? "Categoria"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="relative overflow-hidden rounded-3xl bg-cream">
        {category && (
          <div className="absolute inset-0">
            <ProductImage
              src={category.imageUrl}
              alt={category.name}
              emoji="🍬"
              className="object-cover opacity-25"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
          </div>
        )}
        <div className="relative px-6 py-10 sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-dark">
            Passarelli Doces
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {category?.name ?? "Categoria"}
          </h1>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">{category?.description}</p>
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        <strong className="text-foreground">{products.length}</strong>{" "}
        {products.length === 1 ? "produto" : "produtos"} nesta categoria
      </p>

      <div className="mt-6">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhum produto nesta categoria"
            description="Nossos docinhos por aqui estão sendo preparados com muito carinho."
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
