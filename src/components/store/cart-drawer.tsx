"use client";

import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency } from "@/lib/format";
import { ProductImage } from "./product-image";
import { FreeShippingProgress } from "./free-shipping-progress";

export function CartDrawer() {
  const { items, isOpen, closeCart, subtotal, count, updateQuantity, removeItem } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-5 text-left">
          <SheetTitle className="flex items-center gap-2 font-display text-lg">
            <ShoppingBag className="h-5 w-5 text-gold-dark" />
            Seu Carrinho
          </SheetTitle>
          <SheetDescription>
            {count} {count === 1 ? "item" : "itens"} no carrinho
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blush text-rose">
                <ShoppingBag className="h-8 w-8" aria-hidden />
              </div>
              <p className="font-display text-lg font-semibold">Seu carrinho está vazio</p>
              <p className="text-sm text-muted-foreground">
                Que tal adicionar uma delícia especial?
              </p>
              <Button className="mt-2 rounded-full" onClick={closeCart} asChild>
                <Link to="/produtos">Ver produtos</Link>
              </Button>
            </div>
          ) : (
            <div className="p-4">
              <FreeShippingProgress />
              <ul className="mt-2 space-y-3">
                {items.map((item) => (
                  <li
                    key={item.productId}
                    className="flex gap-3 rounded-2xl border border-border bg-card p-3"
                  >
                    <Link
                      to="/produtos/$slug"
                      params={{ slug: item.slug }}
                      onClick={closeCart}
                      className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream"
                    >
                      <ProductImage src={item.imageUrl} alt={item.name} emoji="🧁" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to="/produtos/$slug"
                          params={{ slug: item.slug }}
                          onClick={closeCart}
                          className="line-clamp-2 text-sm font-semibold text-foreground hover:text-chocolate-dark"
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
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1 rounded-full border border-border">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="text-sm font-bold text-chocolate-dark">
                          {formatCurrency(item.price * item.quantity)}
                          {item.compareAtPrice && item.compareAtPrice > item.price && (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground line-through">
                              {formatCurrency(item.compareAtPrice * item.quantity)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border bg-background p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-display text-xl font-bold text-chocolate-dark">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Frete calculado no checkout</p>
            <Button className="mt-4 h-12 w-full rounded-full text-base font-semibold" asChild>
              <Link to="/checkout" onClick={closeCart}>
                Finalizar compra
              </Link>
            </Button>
            <Button
              variant="outline"
              className="mt-2 h-11 w-full rounded-full"
              onClick={closeCart}
              asChild
            >
              <Link to="/carrinho">Abrir carrinho completo</Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
