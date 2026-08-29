import { cn } from "@/lib/utils";

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("group overflow-hidden rounded-2xl border border-border bg-card", className)}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted/80 to-muted" />
      </div>
      <div className="space-y-3 p-4">
        <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function BannerSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-muted",
        "aspect-[4/3] sm:aspect-[16/7] lg:aspect-[21/8]",
        className,
      )}
    >
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted/70 to-muted" />
      <div className="absolute inset-0 flex items-center gap-3 p-8 sm:p-12">
        <div className="h-5 w-40 animate-pulse rounded-full bg-background/50" />
        <div className="h-10 w-72 animate-pulse rounded-2xl bg-background/40" />
      </div>
    </div>
  );
}

export function SectionSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square rounded-2xl bg-muted" />
          <div className="mx-auto mt-3 h-3 w-2/3 rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}
