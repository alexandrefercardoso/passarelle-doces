"use client";

import { Link, type LinkProps } from "@tanstack/react-router";
import { Heart, Menu, Package, ShoppingBag, UserRound } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { SearchBox } from "./search-box";

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center gap-3 py-3 md:gap-6">
          {/* Botão de menu mobile */}
          <button
            type="button"
            onClick={onOpenMenu}
            className="-ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Logo />

          {/* Busca desktop */}
          <div className="hidden flex-1 lg:block">
            <SearchBox className="max-w-xl" />
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <HeaderLink to="/conta" label="Minha Conta">
              <UserRound className="h-5 w-5" />
            </HeaderLink>
            <HeaderLink to="/favoritos" label="Favoritos">
              <Heart className="h-5 w-5" />
            </HeaderLink>
            <HeaderLink to="/pedidos" label="Meus Pedidos" className="hidden sm:inline-flex">
              <Package className="h-5 w-5" />
            </HeaderLink>
            <CartButton />
          </div>
        </div>

        {/* Busca mobile */}
        <div className="pb-3 lg:hidden">
          <SearchBox />
        </div>
      </div>
    </header>
  );
}

function HeaderLink({
  to,
  label,
  children,
  className,
}: {
  to: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to as never}
      aria-label={label}
      className={cn(
        "inline-flex h-10 w-10 flex-col items-center justify-center gap-0.5 rounded-full text-foreground transition-colors hover:bg-accent hover:text-chocolate-dark",
        className,
      )}
    >
      {children}
      <span className="hidden text-[9px] font-medium leading-none text-muted-foreground lg:block">
        {label}
      </span>
    </Link>
  );
}

function CartButton() {
  const { count, openCart } = useCart();
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Carrinho com ${count} ${count === 1 ? "item" : "itens"}`}
      className="relative inline-flex h-10 w-10 flex-col items-center justify-center gap-0.5 rounded-full text-foreground transition-colors hover:bg-accent hover:text-chocolate-dark"
    >
      <ShoppingBag className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose px-1 text-[10px] font-bold text-white shadow">
          {count}
        </span>
      )}
      <span className="hidden text-[9px] font-medium leading-none text-muted-foreground lg:block">
        Carrinho
      </span>
    </button>
  );
}
