"use client";

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar,
  Clock,
  Download,
  Package,
  Printer,
  ReceiptText,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { printReport } from "@/components/admin/print-report";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminData } from "@/hooks/use-admin-data";
import { useAllOrders } from "@/hooks/use-store-data";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/admin/relatorios")({
  component: AdminRelatoriosPage,
});

type DatePreset = "hoje" | "7d" | "30d" | "90d" | "todos";

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "hoje", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "todos", label: "Todos" },
];

function getDateRange(preset: DatePreset): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  switch (preset) {
    case "hoje":
      start.setHours(0, 0, 0, 0);
      break;
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "90d":
      start.setDate(start.getDate() - 90);
      break;
    case "todos":
      start.setFullYear(2000, 0, 1);
      break;
  }
  return { start, end };
}

function AdminRelatoriosPage() {
  const { data: allOrders, isLoading } = useAllOrders();
  const { products } = useAdminData();
  const [preset, setPreset] = useState<DatePreset>("30d");

  const { start, end } = getDateRange(preset);

  const orders = useMemo(() => {
    if (!allOrders) return [];
    return allOrders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= start && d <= end;
    });
  }, [allOrders, start, end]);

  const pdvOrders = orders.filter((o) => o.source === "pdv");
  const siteOrders = orders.filter((o) => o.source === "site");
  const validOrders = orders.filter((o) => o.status !== "cancelado");
  const pdvValid = pdvOrders.filter((o) => o.status !== "cancelado");
  const siteValid = siteOrders.filter((o) => o.status !== "cancelado");

  const totalRevenue = validOrders.reduce((a, o) => a + o.total, 0);
  const pdvRevenue = pdvValid.reduce((a, o) => a + o.total, 0);
  const siteRevenue = siteValid.reduce((a, o) => a + o.total, 0);
  const avgTicket = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

  const revenueByPayment = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of validOrders) {
      const key = o.paymentMethod;
      map[key] = (map[key] ?? 0) + o.total;
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([method, total]) => ({ method, total }));
  }, [validOrders]);

  const revenueByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of orders) {
      map[o.status] = (map[o.status] ?? 0) + o.total;
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([status, total]) => ({ status, total }));
  }, [orders]);

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const o of validOrders) {
      for (const item of o.items) {
        if (!map[item.productId]) {
          map[item.productId] = { name: item.name, qty: 0, revenue: 0 };
        }
        const entry = map[item.productId]!;
        entry.qty += item.quantity;
        entry.revenue += item.unitPrice * item.quantity;
      }
    }
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [validOrders]);

  const revenueByDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of validOrders) {
      const day = o.createdAt.slice(0, 10);
      map[day] = (map[day] ?? 0) + o.total;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total }));
  }, [validOrders]);

  const maxDailyRevenue = Math.max(...revenueByDay.map((d) => d.total), 1);

  const uniqueCustomers = useMemo(() => {
    const set = new Set(orders.map((o) => o.customer.name.toLowerCase().trim()));
    return set.size;
  }, [orders]);

  const exportCSV = () => {
    const header = "Pedido,Data,Origem,Cliente,Total,Status,Pagamento";
    const rows = orders.map(
      (o) =>
        `${o.id},${o.createdAt},${o.source},${o.customer.name},${o.total},${o.status},${o.paymentMethod}`,
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-vendas-${preset}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printA4 = () => {
    const presetLabel = DATE_PRESETS.find((p) => p.value === preset)?.label ?? preset;
    printReport({
      title: "Relatório de Vendas",
      subtitle: `${presetLabel} — Passarelli Doces`,
      orders,
      format: "a4",
    });
  };

  const printCupom = () => {
    const presetLabel = DATE_PRESETS.find((p) => p.value === preset)?.label ?? preset;
    printReport({
      title: "Relatório de Vendas",
      subtitle: `${presetLabel}`,
      orders,
      format: "cupom",
    });
  };

  const paymentLabel: Record<string, string> = {
    credit: "Crédito",
    debit: "Débito",
    pix: "Pix",
    money: "Dinheiro",
    boleto: "Boleto",
  };

  const statusLabel: Record<string, string> = {
    aguardando_pagamento: "Aguardando",
    confirmado: "Confirmado",
    preparando: "Preparando",
    enviado: "Enviado",
    entregue: "Entregue",
    cancelado: "Cancelado",
  };

  const statusColor: Record<string, string> = {
    aguardando_pagamento: "bg-amber-100 text-amber-700",
    confirmado: "bg-blue-100 text-blue-700",
    preparando: "bg-purple-100 text-purple-700",
    enviado: "bg-indigo-100 text-indigo-700",
    entregue: "bg-green-100 text-green-700",
    cancelado: "bg-red-100 text-red-700",
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Relatórios
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Análise de vendas e desempenho da sua loja.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={preset} onValueChange={(v) => setPreset(v as DatePreset)}>
            <SelectTrigger className="w-44 rounded-full">
              <Calendar className="mr-2 h-4 w-4 text-gold-dark" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="rounded-full" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={printA4}>
            <Printer className="mr-2 h-4 w-4" />
            Relatório A4
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={printCupom}>
            <Printer className="mr-2 h-4 w-4" />
            Cupom
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Wallet className="h-5 w-5" />}
          label="Receita total"
          value={formatCurrency(totalRevenue)}
          hint={`${validOrders.length} pedidos válidos`}
          accent="bg-gold-soft text-gold-dark"
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Ticket médio"
          value={formatCurrency(avgTicket)}
          hint={`por pedido`}
          accent="bg-chocolate/10 text-chocolate"
        />
        <KpiCard
          icon={<Store className="h-5 w-5" />}
          label="Receita PDV"
          value={formatCurrency(pdvRevenue)}
          hint={`${pdvValid.length} pedidos`}
          accent="bg-chocolate/10 text-chocolate"
        />
        <KpiCard
          icon={<ShoppingBag className="h-5 w-5" />}
          label="Receita Site"
          value={formatCurrency(siteRevenue)}
          hint={`${siteValid.length} pedidos`}
          accent="bg-blue-50 text-blue-700"
        />
      </div>

      {/* Segunda linha de KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          icon={<ReceiptText className="h-5 w-5" />}
          label="Total de pedidos"
          value={String(orders.length)}
          hint={`${orders.filter((o) => o.status === "cancelado").length} cancelados`}
          accent="bg-purple-50 text-purple-700"
        />
        <KpiCard
          icon={<Users className="h-5 w-5" />}
          label="Clientes únicos"
          value={String(uniqueCustomers)}
          hint="no período"
          accent="bg-blush text-rose"
        />
        <KpiCard
          icon={<Package className="h-5 w-5" />}
          label="Produtos vendidos"
          value={String(
            validOrders.reduce((a, o) => a + o.items.reduce((b, i) => b + i.quantity, 0), 0),
          )}
          hint="unidades"
          accent="bg-green-50 text-green-700"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vendas PDV vs Site */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-bold text-foreground">PDV vs Site</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Comparação de receita por canal de venda.
          </p>
          <div className="mt-4 space-y-3">
            <BarRow
              label="PDV"
              value={pdvRevenue}
              max={Math.max(pdvRevenue, siteRevenue)}
              color="bg-chocolate"
              count={pdvValid.length}
            />
            <BarRow
              label="Site"
              value={siteRevenue}
              max={Math.max(pdvRevenue, siteRevenue)}
              color="bg-blue-600"
              count={siteValid.length}
            />
          </div>
        </div>

        {/* Formas de pagamento */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-bold text-foreground">Formas de pagamento</h3>
          <p className="mt-1 text-xs text-muted-foreground">Receita por método de pagamento.</p>
          <div className="mt-4 space-y-3">
            {revenueByPayment.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum dado no período.</p>
            ) : (
              revenueByPayment.map((r) => (
                <BarRow
                  key={r.method}
                  label={paymentLabel[r.method] ?? r.method}
                  value={r.total}
                  max={revenueByPayment[0]?.total ?? 1}
                  color="bg-gold-dark"
                  count={null}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Vendas por dia */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-lg font-bold text-foreground">Vendas por dia</h3>
        <p className="mt-1 text-xs text-muted-foreground">Receita diária no período selecionado.</p>
        {revenueByDay.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nenhum dado no período.</p>
        ) : (
          <div className="mt-4 flex items-end gap-1" style={{ height: 180 }}>
            {revenueByDay.map((d) => {
              const h = Math.max((d.total / maxDailyRevenue) * 160, 4);
              return (
                <div key={d.date} className="group relative flex flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-chocolate transition-all hover:bg-chocolate-dark"
                    style={{ height: h }}
                  />
                  <div className="pointer-events-none absolute -top-10 left-1/2 z-10 hidden -translate-x-1/2 rounded-lg bg-foreground px-2 py-1 text-[10px] font-bold text-background group-hover:block">
                    {formatCurrency(d.total)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {revenueByDay.length > 0 && (
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>{revenueByDay[0]?.date}</span>
            <span>{revenueByDay[revenueByDay.length - 1]?.date}</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top produtos */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-bold text-foreground">Produtos mais vendidos</h3>
          <p className="mt-1 text-xs text-muted-foreground">Top 10 por receita no período.</p>
          {topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nenhum dado no período.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {topProducts.map((p, i) => (
                <li
                  key={p.name}
                  className="flex items-center gap-3 rounded-xl border border-border px-3 py-2"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-soft text-xs font-bold text-gold-dark">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.qty} un. vendidas</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-chocolate-dark">
                    {formatCurrency(p.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Status dos pedidos */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-bold text-foreground">Status dos pedidos</h3>
          <p className="mt-1 text-xs text-muted-foreground">Receita por status no período.</p>
          {revenueByStatus.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nenhum dado no período.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {revenueByStatus.map((r) => (
                <div
                  key={r.status}
                  className="flex items-center justify-between rounded-xl border border-border px-3 py-2"
                >
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-bold",
                      statusColor[r.status] ?? "bg-gray-100 text-gray-600",
                    )}
                  >
                    {statusLabel[r.status] ?? r.status}
                  </span>
                  <span className="text-sm font-bold text-chocolate-dark">
                    {formatCurrency(r.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${accent}`}>
          {icon}
        </div>
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold text-foreground">{value}</p>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  color,
  count,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  count: number | null;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          {label}
          {count !== null && <span className="ml-2 text-xs text-muted-foreground">({count})</span>}
        </span>
        <span className="font-bold text-chocolate-dark">{formatCurrency(value)}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
