import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, Loader2, MapPin, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/store/empty-state";
import {
  paymentLabel,
  statusColorClass,
  statusLabel,
  statusPaymentLabel,
} from "@/components/store/order-status";
import { ProductImage } from "@/components/store/product-image";
import { useAllOrders } from "@/hooks/use-store-data";
import { adminDeleteOrder } from "@/lib/api";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { buildWhatsAppLink, formatCurrency, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_store/pedidos/$id")({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useAllOrders();
  const order = data?.find((o) => o.id === id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await adminDeleteOrder(id);
      if (!res.ok) {
        toast.error("Não foi possível excluir o pedido", {
          description: res.error ?? "Tente novamente.",
        });
        return;
      }
      toast.success("Pedido excluído com sucesso");
      void queryClient.invalidateQueries({ queryKey: ["all-orders"] });
      void navigate({ to: "/admin/pedidos" });
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="h-44 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Pedido não encontrado"
          description="Não localizamos um pedido com esse identificador."
          action={
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/pedidos">Ver meus pedidos</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        to="/pedidos"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-chocolate-dark"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar aos pedidos
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
            Pedido {order.id}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Realizado em {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-4 py-1.5 text-xs font-bold ${statusColorClass(order.status)}`}
          >
            {statusLabel[order.status] ?? order.status}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={deleting}
            onClick={() => {
              if (
                window.confirm(
                  "Excluir este pedido e todos os seus itens? Esta ação não pode ser desfeita.",
                )
              ) {
                void handleDelete();
              }
            }}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Excluir pedido
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_280px]">
        {/* Itens */}
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold text-foreground">Itens do pedido</h2>
          <ul className="mt-4 space-y-4">
            {order.items.map((item) => (
              <li key={`${item.productId}-${item.name}`} className="flex items-center gap-4">
                <Link
                  to="/produtos/$slug"
                  params={{ slug: slugFromName(item.name) }}
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream"
                >
                  <ProductImage src={item.imageUrl} alt={item.name} emoji="🧁" />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-bold text-chocolate-dark">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{formatCurrency(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Frete</dt>
              <dd className="font-medium">
                {order.shipping === 0 ? "Grátis" : formatCurrency(order.shipping)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <dt className="font-semibold text-foreground">Total</dt>
              <dd className="font-display text-2xl font-extrabold text-chocolate-dark">
                {formatCurrency(order.total)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Dados */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gold-dark">
              <MessageCircle className="h-4 w-4" /> Contato
            </h2>
            <p className="mt-3 text-sm font-semibold text-foreground">{order.customer.name}</p>
            <p className="text-sm text-muted-foreground">{order.customer.email}</p>
            <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gold-dark">
              <MapPin className="h-4 w-4" /> Entrega
            </h2>
            <p className="mt-3 text-sm text-foreground">
              {order.customer.address}, {order.customer.number}
              {order.customer.complement && ` - ${order.customer.complement}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.customer.neighborhood} · {order.customer.city}/{order.customer.state}
            </p>
            <p className="text-sm text-muted-foreground">CEP: {order.customer.zipCode}</p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gold-dark">
              <CreditCard className="h-4 w-4" /> Pagamento
            </h2>
            <p className="mt-3 text-sm font-semibold text-foreground">
              {paymentLabel(order.paymentMethod)}
            </p>
            <p className="text-sm text-muted-foreground">
              Status: {statusPaymentLabel(order.paymentStatus)}
            </p>
          </div>

          <a
            href={buildWhatsAppLink(
              DEFAULT_SETTINGS.whatsapp,
              `Olá! Preciso de ajuda com o pedido ${order.id}.`,
            )}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" />
            Falar sobre este pedido
          </a>
        </div>
      </div>
    </div>
  );
}

function slugFromName(_name: string): string {
  return _name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
