"use client";

import { Link } from "@tanstack/react-router";
import {
  BadgePercent,
  Heart,
  Home,
  MessageCircle,
  Package,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCategories } from "@/hooks/use-store-data";
import { Logo } from "./logo";

type MobileMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  const { data: categories = [] } = useCategories();
  const { count } = useCart();
  const { ids } = useWishlist();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 overflow-y-auto bg-background p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center justify-between">
            <Logo size="sm" />
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 py-3">
          <MobileLink to="/" label="Início" icon={<Home className="h-5 w-5" />} badge={count} />
          <MobileLink
            to="/produtos"
            label="Todos os Produtos"
            icon={<Package className="h-5 w-5" />}
          />
          <MobileLink
            to="/promocoes"
            label="Promoções"
            icon={<BadgePercent className="h-5 w-5" />}
          />
        </div>

        <div className="px-3 pb-2">
          <p className="px-2 pb-1.5 text-sm font-bold uppercase tracking-wide text-chocolate-dark">
            Categorias
          </p>
          {categories
            .filter((c) => c.isActive)
            .map((c) => (
              <Link
                key={c.id}
                to={`/categoria/${c.slug}` as never}
                onClick={() => onOpenChange(false)}
                className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-blush hover:text-chocolate-dark"
              >
                {c.name}
              </Link>
            ))}
        </div>

        <div className="mt-2 border-t border-border px-4 py-2">
          <MobileLink to="/conta" label="Minha Conta" icon={<UserRound className="h-5 w-5" />} />
          <MobileLink to="/pedidos" label="Meus Pedidos" icon={<Package className="h-5 w-5" />} />
          <MobileLink
            to="/favoritos"
            label="Favoritos"
            icon={<Heart className="h-5 w-5" />}
            badge={ids.length}
          />
          <MobileLink
            to="/carrinho"
            label="Carrinho"
            icon={<ShoppingBag className="h-5 w-5" />}
            badge={count}
          />
          <MobileLink to="/contato" label="Contato" icon={<MessageCircle className="h-5 w-5" />} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileLink({
  to,
  label,
  icon,
  badge,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}) {
  return (
    <Link
      to={to as never}
      className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-blush hover:text-chocolate-dark"
    >
      <span className="flex items-center gap-3">
        <span className="text-gold-dark">{icon}</span>
        {label}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose px-1.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
