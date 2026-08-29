import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/lib/types";
import { ProductImage } from "./product-image";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      to="/categoria/$slug"
      params={{ slug: category.slug }}
      className="group relative flex flex-col items-center text-center"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-full border-4 border-cream shadow-md transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-gold/60 group-hover:shadow-xl group-hover:shadow-gold/20">
        <ProductImage
          src={category.imageUrl}
          alt={category.name}
          emoji="🍬"
          className="transition-transform duration-500 group-hover:scale-110"
          sizes="25vw"
        />
        <div className="absolute inset-0 bg-chocolate/0 transition-colors duration-300 group-hover:bg-chocolate/10" />
      </div>
      <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-foreground transition-colors group-hover:text-chocolate-dark">
        {category.name}
        <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-all duration-300 group-hover:opacity-100" />
      </div>
    </Link>
  );
}
