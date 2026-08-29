import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/store/empty-state";
import { ErrorState } from "@/components/store/error-state";
import { statusColorClass, statusLabel } from "@/components/store/order-status";
import { ProductImage } from "@/components/store/product-image";
import { useOrders } from "@/hooks/use-store-data";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_store/pedidos/")({
  component: OrdersPage,
  head: () => ({
    meta: [{ title: "Meus Pedidos — Passarelli Doces" }],
  }),
});

function OrdersPage() {
  const { data, isLoading, isError, refetch } = useOrders();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
          Meus Pedidos
        </h1>
        <div className="mt-8 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-muted" />
          ))}
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

  const orders = data ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
            Meus Pedidos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe o status das suas compras.</p>
        </div>
        <Button variant="outline" className="hidden rounded-full sm:inline-flex" asChild>
          <Link to="/produtos">
            <ShoppingBag className="h-4 w-4" />
            Comprar mais
          </Link>
        </Button>
      </div>

      <div className="mt-8">
        {orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum pedido ainda"
            description="Quando você fizer seu primeiro pedido, ele aparecerá aqui para acompanhamento."
            action={
              <Button asChild className="rounded-full">
                <Link to="/produtos">Fazer meu primeiro pedido</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  to="/pedidos/$id"
                  params={{ id: order.id }}
                  className="block rounded-3xl border border-border bg-card p-5 transition-all hover:border-gold/60 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{order.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold",
                        statusColorClass(order.status),
                      )}
                    >
                      {statusLabel[order.status] ?? order.status}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {order.items.slice(0, 3).map((item, i) => (
                        <div
                          key={`${item.productId}-${i}`}
                          className="h-11 w-11 overflow-hidden rounded-full border-2 border-background bg-cream"
                        >
                          <ProductImage src={item.imageUrl} alt={item.name} emoji="🧁" />
                        </div>
                      ))}
                    </div>
                    <p className="min-w-0 truncate text-sm text-muted-foreground">
                      {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                    </p>
                    <span className="ml-auto shrink-0 font-display text-lg font-extrabold text-chocolate-dark">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
