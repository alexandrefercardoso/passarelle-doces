"use client";

import { Link } from "@tanstack/react-router";
import { BadgePercent, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/use-store-data";

export function CategoryNav() {
  const { data: categories = [] } = useCategories();

  const items = [
    { label: "Início", to: "/" },
    { label: "Todos os Produtos", to: "/produtos" },
    ...categories
      .filter((c) => c.isActive)
      .map((c) => ({ label: c.name, to: `/categoria/${c.slug}` })),
    { label: "Promoções", to: "/promocoes", highlight: true },
  ];

  return (
    <nav aria-label="Categorias" className="hidden border-b border-border bg-background md:block">
      <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 sm:px-6">
        {items.map((item, idx) => (
          <Link
            key={idx}
            to={item.to as never}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-3.5 text-sm font-medium text-foreground transition-colors hover:border-gold hover:text-chocolate-dark",
              item.highlight && "text-rose hover:text-rose [&>svg]:text-rose",
            )}
          >
            {idx === 0 && <Home className="h-4 w-4 text-gold-dark" />}
            {item.highlight && <BadgePercent className="h-4 w-4" />}
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
