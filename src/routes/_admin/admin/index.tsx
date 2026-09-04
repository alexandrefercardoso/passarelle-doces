import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BadgePercent,
  BarChart3,
  Clock,
  Package,
  PackageX,
  ReceiptText,
  ShoppingCart,
  Sparkles,
  Tags,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useAdminData } from "@/hooks/use-admin-data";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { statusLabel, statusColorClass } from "@/components/store/order-status";

export const Route = createFileRoute("/_admin/admin/")({
  component: AdminDashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function AdminDashboard() {
  const { products, categories, banners, orders, loading } = useAdminData();

  const activeProducts = products.filter((p) => p.isActive);
  const pendingOrders = orders.filter(
    (o) => o.paymentStatus === "pendente" && o.status !== "cancelado",
  );
  const lowStock = activeProducts.filter((p) => p.stock <= 5);
  const outOfStock = activeProducts.filter((p) => p.stock <= 0);
  const aReceber = pendingOrders.reduce((acc, o) => acc + o.total, 0);

  const recentOrders = [...orders]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-72 animate-pulse rounded-2xl bg-muted lg:col-span-2" />
          <div className="h-72 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: "Pedidos aguardando",
      value: String(pendingOrders.length),
      hint: `${formatCurrency(aReceber)} a receber`,
      icon: <Clock className="h-5 w-5" />,
      to: "/admin/pedidos",
      accent: "bg-gold-soft text-gold-dark",
    },
    {
      label: "Pedidos totais",
      value: String(orders.length),
      hint: "todos os pedidos registrados",
      icon: <ReceiptText className="h-5 w-5" />,
      to: "/admin/pedidos",
      accent: "bg-chocolate/10 text-chocolate",
    },
    {
      label: "Estoque baixo",
      value: String(lowStock.length),
      hint: outOfStock.length > 0 ? `${outOfStock.length} sem estoque` : "estoque saudável",
      icon: <PackageX className="h-5 w-5" />,
      to: "/admin/produtos",
      accent: "bg-blush text-rose",
    },
    {
      label: "Produtos ativos",
      value: String(activeProducts.length),
      hint: `${categories.length} categorias`,
      icon: <Package className="h-5 w-5" />,
      to: "/admin/produtos",
      accent: "bg-cream text-chocolate-dark",
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gold-dark">
            <Sparkles className="h-3.5 w-3.5" />
            {greeting()}, administrador
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Visão geral da sua loja de doces.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            to={kpi.to as never}
            className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${kpi.accent}`}
              >
                {kpi.icon}
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="mt-3 font-display text-3xl font-extrabold text-foreground">{kpi.value}</p>
            <p className="text-sm font-medium text-foreground">{kpi.label}</p>
            <p className="text-xs text-muted-foreground">{kpi.hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
                <BarChart3 className="h-5 w-5 text-gold-dark" />
                Pedidos recentes
              </h2>
              <p className="text-xs text-muted-foreground">Os últimos pedidos da sua loja.</p>
            </div>
            <Link
              to="/admin/pedidos"
              className="flex items-center gap-1 text-xs font-semibold text-gold-dark hover:text-chocolate-dark"
            >
              Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
                <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm font-medium text-foreground">Nenhum pedido ainda</p>
                <p className="text-xs text-muted-foreground">
                  Os pedidos feitos na loja aparecerão aqui.
                </p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to="/admin/pedidos"
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 transition-colors hover:border-gold"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-chocolate/10 text-chocolate">
                      <ReceiptText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {order.customer.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        #{order.id.slice(0, 8)} · {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-chocolate-dark">
                        {formatCurrency(order.total)}
                      </p>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColorClass(order.status)}`}
                      >
                        {statusLabel[order.status] ?? order.status}
                      </span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-bold text-foreground">Ações rápidas</h2>
            <div className="mt-3 grid gap-2">
              <QuickAction to="/admin/produtos" label="Gerenciar produtos" />
              <QuickAction to="/admin/banners" label="Banners da página inicial" />
              <QuickAction to="/admin/categorias" label="Ajustar categorias" />
              <QuickAction to="/" label="Ir para a loja" />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border bg-gradient-to-br from-chocolate to-chocolate-dark p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
                <Wallet className="h-4 w-4" />
                Em destaque
              </p>
              <p className="mt-2 font-display text-2xl font-extrabold text-cream">
                {banners.filter((b) => b.isActive).length} batons ativos
              </p>
              <p className="mt-1 text-xs text-cream/70">
                {categories.length} categorias no catálogo
              </p>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <TrendingUp className="h-4 w-4 text-gold-dark" />
                Ticket médio
              </span>
              <span className="font-display text-lg font-extrabold text-chocolate-dark">
                {orders.length > 0
                  ? formatCurrency(
                      orders
                        .filter((o) => o.status !== "cancelado" && o.paymentStatus !== "cancelado")
                        .reduce((a, o) => a + o.total, 0) /
                        orders.filter(
                          (o) => o.status !== "cancelado" && o.paymentStatus !== "cancelado",
                        ).length,
                    )
                  : formatCurrency(0)}
              </span>
            </div>
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
      <span className="flex items-center gap-2">
        <BadgePercent className="h-4 w-4 text-gold-dark" />
        {label}
      </span>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
