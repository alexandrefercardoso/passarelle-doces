import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/store/empty-state";
import { FreeShippingProgress } from "@/components/store/free-shipping-progress";
import { ProductImage } from "@/components/store/product-image";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_store/carrinho")({
  component: CartPage,
  head: () => ({
    meta: [{ title: "Meu Carrinho — Passarelli Doces" }],
  }),
});

function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, clearCart } = useCart();
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(false);

  const discount = applied ? subtotal * 0.1 : 0;
  const total = subtotal - discount;

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === "PASSARELLI10") {
      setApplied(true);
      toast.success("Cupom aplicado!", { description: "Você ganhou 10% de desconto. 🎉" });
    } else {
      toast.error("Cupom inválido", { description: "Verifique o código e tente novamente." });
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={ShoppingBag}
          title="Seu carrinho está vazio"
          description="Explore nossas delícias e adicione seus doces favoritos."
          action={
            <Button asChild className="rounded-full">
              <Link to="/produtos">Conhecer os produtos</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
        Meu Carrinho
      </h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Itens */}
        <div>
          <FreeShippingProgress />
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li
                key={item.productId}
                className="flex gap-4 rounded-2xl border border-border bg-card p-4"
              >
                <Link
                  to="/produtos/$slug"
                  params={{ slug: item.slug }}
                  className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-cream"
                >
                  <ProductImage src={item.imageUrl} alt={item.name} emoji="🧁" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to="/produtos/$slug"
                      params={{ slug: item.slug }}
                      className="line-clamp-2 font-display text-base font-semibold text-foreground hover:text-chocolate-dark"
                    >
                      {item.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                      aria-label={`Remover ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatCurrency(item.price)} / un
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1 rounded-full border border-border">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-chocolate-dark">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                      {item.compareAtPrice && item.compareAtPrice > item.price && (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatCurrency(item.compareAtPrice * item.quantity)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex gap-3">
            <Button
              variant="ghost"
              className="rounded-full text-sm text-muted-foreground"
              onClick={clearCart}
            >
              Esvaziar carrinho
            </Button>
          </div>
        </div>

        {/* Resumo */}
        <aside className="h-fit rounded-3xl border border-border bg-card p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-lg font-bold text-foreground">Resumo do pedido</h2>

          {/* Cupom */}
          <div className="mt-4">
            <label htmlFor="coupon" className="text-xs font-medium text-muted-foreground">
              Cupom de desconto
            </label>
            <div className="mt-1.5 flex gap-2">
              <div className="relative flex-1">
                <Tag
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  id="coupon"
                  value={coupon}
                  onChange={(e) => {
                    setCoupon(e.target.value);
                    setApplied(false);
                  }}
                  placeholder="PASSARELLI10"
                  className="h-10 w-full rounded-full border border-border pl-9 pr-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <Button
                variant="outline"
                className="h-10 rounded-full"
                onClick={applyCoupon}
                disabled={applied}
              >
                Aplicar
              </Button>
            </div>
            {applied && (
              <p className="mt-1.5 text-xs font-medium text-gold-dark">
                Cupom PASSARELLI10 aplicado ✓
              </p>
            )}
          </div>

          <dl className="mt-5 space-y-2.5 border-t border-border pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium text-foreground">{formatCurrency(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Desconto</dt>
              <dd className="font-medium text-chocolate-dark">
                {discount > 0 ? `- ${formatCurrency(discount)}` : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Frete</dt>
              <dd className="font-medium text-foreground">Calculado no checkout</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <dt className="font-semibold text-foreground">Total</dt>
              <dd className="font-display text-2xl font-extrabold text-chocolate-dark">
                {formatCurrency(total)}
              </dd>
            </div>
          </dl>

          <Button className="mt-5 h-12 w-full rounded-full text-base font-semibold" asChild>
            <Link to="/checkout">
              Continuar para checkout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-gold-dark" />
            Compra 100% segura
          </p>
        </aside>
      </div>

      {/* Benefícios */}
      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <TrustItem
          icon={<Truck className="h-5 w-5" />}
          title="Entrega caprichada"
          text="Embalagens que preservam sabor e textura."
        />
        <TrustItem
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Pagamento seguro"
          text="PIX, cartão e boleto com confirmação rápida."
        />
        <TrustItem
          icon={<Tag className="h-5 w-5" />}
          title="Preço justo"
          text="Doces artesanais com qualidade de confeitaria."
        />
      </div>
    </div>
  );
}

function TrustItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-soft text-gold-dark">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
