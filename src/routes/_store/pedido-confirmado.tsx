import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, Package, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_store/pedido-confirmado")({
  validateSearch: (search: Record<string, unknown>): { orderId?: string } => {
    const result: { orderId?: string } = {};
    if (typeof search["orderId"] === "string") result.orderId = search["orderId"];
    return result;
  },
  component: OrderConfirmedPage,
});

function OrderConfirmedPage() {
  const { orderId } = Route.useSearch();

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center rounded-3xl border border-border bg-card p-8 text-center shadow-sm sm:p-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-soft text-gold-dark">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-foreground">
          Pedido confirmado!
        </h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          Recebemos seu pedido com muito carinho. Em breve você receberá as instruções de pagamento
          e acompanhamento por e-mail/WhatsApp.
        </p>

        {orderId && (
          <p className="mt-5 rounded-full bg-cream px-5 py-2 text-sm font-semibold text-chocolate-dark">
            Pedido: <strong>{orderId}</strong>
          </p>
        )}

        <div className="mt-6 grid w-full gap-2 text-left text-sm">
          <p className="flex items-start gap-2.5 rounded-xl bg-cream p-3 text-muted-foreground">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
            Seus doces serão preparados conforme a forma de entrega escolhida.
          </p>
          <p className="flex items-start gap-2.5 rounded-xl bg-cream p-3 text-muted-foreground">
            <Package className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
            Acompanhe o status em <strong className="text-chocolate-dark">Meus Pedidos</strong>.
          </p>
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button className="rounded-full px-8" asChild>
            <Link to="/pedidos">Acompanhar pedidos</Link>
          </Button>
          <Button variant="outline" className="rounded-full px-8" asChild>
            <Link to="/produtos">
              <ShoppingBag className="h-4 w-4" />
              Continuar comprando
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
