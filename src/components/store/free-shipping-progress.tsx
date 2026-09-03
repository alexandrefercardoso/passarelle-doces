import { Truck } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useSiteSettings } from "@/hooks/use-store-data";
import { formatCurrency } from "@/lib/format";

export function FreeShippingProgress() {
  const { subtotal } = useCart();
  const { data: settings } = useSiteSettings();

  const freeShippingEnabled = settings?.freeShippingEnabled ?? false;
  const threshold = settings?.freeShippingThreshold ?? 199;

  if (!freeShippingEnabled) return null;

  const remaining = Math.max(0, threshold - subtotal);
  const percent = Math.min(100, Math.round((subtotal / threshold) * 100));

  if (remaining <= 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-gold-soft px-3 py-2.5 text-sm font-medium text-chocolate-dark">
        <Truck className="h-4 w-4 shrink-0 text-gold-dark" />
        Parabéns! Você ganhou <strong>frete grátis</strong> 🎉
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-cream px-3 py-2.5">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Truck className="h-4 w-4 shrink-0 text-gold-dark" />
        Faltam <strong className="text-chocolate-dark">{formatCurrency(remaining)}</strong> para
        ganhar frete grátis
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold to-rose transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
