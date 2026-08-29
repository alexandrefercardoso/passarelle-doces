import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, BadgePercent, Package, ReceiptText, Tags, TrendingUp } from "lucide-react";
import { useAdminData } from "@/hooks/use-admin-data";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { products, categories, banners, loading } = useAdminData();

  const activeProducts = products.filter((p) => p.isActive);
  const onSale = products.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price);
  const totalValue = products.reduce(
    (acc, p) =>
      acc +
      (p.compareAtPrice && p.compareAtPrice > p.price ? p.price : p.price) * (p.salesCount || 0),
    0,
  );

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Produtos ativos",
      value: String(activeProducts.length),
      icon: <Package className="h-5 w-5" />,
      to: "/admin/produtos",
      accent: "bg-chocolate/10 text-chocolate",
    },
    {
      label: "Categorias",
      value: String(categories.length),
      icon: <Tags className="h-5 w-5" />,
      to: "/admin/categorias",
      accent: "bg-gold-soft text-gold-dark",
    },
    {
      label: "Banners ativos",
      value: String(banners.filter((b) => b.isActive).length),
      icon: <BadgePercent className="h-5 w-5" />,
      to: "/admin/banners",
      accent: "bg-blush text-rose",
    },
    {
      label: "Em promoção",
      value: String(onSale.length),
      icon: <TrendingUp className="h-5 w-5" />,
      to: "/admin/produtos",
      accent: "bg-cream text-chocolate-dark",
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Visão geral da sua loja.</p>
        </div>
        <Link
          to="/admin/produtos"
          className="inline-flex items-center gap-1.5 rounded-full bg-chocolate px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-chocolate-dark"
        >
          + Novo produto
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to as never}
            className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${card.accent}`}
            >
              {card.icon}
            </div>
            <p className="mt-3 font-display text-2xl font-extrabold text-foreground">
              {card.value}
            </p>
            <p className="flex items-center gap-1 text-sm text-muted-foreground transition-colors group-hover:text-chocolate-dark">
              {card.label}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold text-foreground">Valor estimado vendido</h2>
          <p className="mt-1 font-display text-3xl font-extrabold text-chocolate-dark">
            {formatCurrency(totalValue)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Estimativa baseada em sales_count × preço médio.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold text-foreground">Ações rápidas</h2>
          <div className="mt-3 grid gap-2">
            <QuickAction to="/admin/banners" label="Gerenciar banners da página inicial" />
            <QuickAction to="/admin/categorias" label="Ajustar categorias em destaque" />
            <QuickAction to="/admin/pedidos" label="Acompanhar pedidos da loja" />
            <QuickAction to="/" label="Ir para a loja" />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to as never}
      className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-gold hover:text-chocolate-dark"
    >
      <ReceiptText className="h-4 w-4 text-gold-dark" />
      <span className="ml-3 flex-1 text-left">{label}</span>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
