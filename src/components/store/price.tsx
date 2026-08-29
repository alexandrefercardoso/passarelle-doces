import { cn } from "@/lib/utils";
import { formatCurrency, formatDiscountPercent } from "@/lib/format";

type PriceProps = {
  price: number;
  compareAtPrice?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
  showDiscount?: boolean;
};

const sizeMap = {
  sm: { price: "text-base", old: "text-xs", percent: "text-[10px]" },
  md: { price: "text-lg", old: "text-sm", percent: "text-xs" },
  lg: { price: "text-2xl", old: "text-base", percent: "text-sm" },
} as const;

export function Price({
  price,
  compareAtPrice,
  className,
  size = "md",
  showDiscount = true,
}: PriceProps) {
  const isSale = !!compareAtPrice && compareAtPrice > price;
  const percent = isSale && compareAtPrice ? formatDiscountPercent(compareAtPrice, price) : 0;
  const s = sizeMap[size];

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className={cn("font-display font-bold tracking-tight", s.price)}>
          {formatCurrency(price)}
        </span>
        {isSale && (
          <span className={cn("font-normal text-muted-foreground line-through", s.old)}>
            {formatCurrency(compareAtPrice as number)}
          </span>
        )}
      </div>
      {isSale && showDiscount && (
        <span
          className={cn(
            "mt-0.5 inline-flex w-fit items-center rounded-full bg-destructive/10 px-2 py-0.5 font-semibold text-destructive",
            s.percent,
          )}
        >
          -{percent}%
        </span>
      )}
    </div>
  );
}
