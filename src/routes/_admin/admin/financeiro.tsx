"use client";

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  TrendingUp,
  XCircle,
  Filter,
  Loader2,
  Printer,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useAllOrders } from "@/hooks/use-store-data";
import { adminUpdateOrderPaymentStatus } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { statusLabel, paymentLabel } from "@/components/store/order-status";
import type { Order } from "@/lib/types";

export const Route = createFileRoute("/_admin/admin/financeiro")({
  component: AdminFinanceiroPage,
});

type TabType = "dashboard" | "contas-receber";

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pendente: "#f59e0b",
  aprovado: "#22c55e",
  recusado: "#ef4444",
  cancelado: "#6b7280",
};

const METHOD_COLORS: Record<string, string> = {
  pix: "#00b894",
  cartao: "#6c5ce7",
  cartao_debito: "#8e7cc3",
  boleto: "#fdcb6e",
  dinheiro: "#27ae60",
  cheque: "#e84393",
  caderneta: "#0984e3",
};

function fmtShort(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function AdminFinanceiroPage() {
  const [tab, setTab] = useState<TabType>("dashboard");
  const { data: allOrders, isLoading } = useAllOrders();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("todos");

  const orders = useMemo(() => allOrders ?? [], [allOrders]);

  const hasDateFilter = startDate !== "" || endDate !== "";

  // Filtra os pedidos pelo período e origem selecionados
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (sourceFilter !== "todos") {
      result = result.filter((o) => o.source === sourceFilter);
    }
    if (!hasDateFilter) return result;
    return result.filter((o) => {
      const created = new Date(o.createdAt);
      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T23:59:59.999`);
      if (startDate && created < start) return false;
      if (endDate && created > end) return false;
      return true;
    });
  }, [orders, startDate, endDate, hasDateFilter, sourceFilter]);

  const clearDates = () => {
    setStartDate("");
    setEndDate("");
  };

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-muted" />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Financeiro
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe as receitas, pagamentos e contas a receber da loja.
          </p>
        </div>
        <div className="flex gap-1 rounded-full border border-border bg-card p-1">
          <button
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
              tab === "dashboard"
                ? "bg-chocolate text-cream"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
              tab === "contas-receber"
                ? "bg-chocolate text-cream"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setTab("contas-receber")}
          >
            Contas a Receber
          </button>
        </div>
      </div>

      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartChange={setStartDate}
        onEndChange={setEndDate}
        onClear={clearDates}
        hasFilter={hasDateFilter}
      />

      {/* Filtro de origem */}
      <div className="mt-4 flex gap-2">
        {[
          { value: "todos", label: "Todos" },
          { value: "pdv", label: "PDV" },
          { value: "site", label: "Site" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSourceFilter(opt.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
              sourceFilter === opt.value
                ? opt.value === "pdv"
                  ? "bg-chocolate text-cream"
                  : opt.value === "site"
                    ? "bg-blue-600 text-white"
                    : "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" ? (
        <DashboardTab orders={filteredOrders} periodStart={startDate} periodEnd={endDate} />
      ) : (
        <ContasReceberTab orders={filteredOrders} periodStart={startDate} periodEnd={endDate} />
      )}
    </div>
  );
}

/* ================================================================== */
/* FILTRO DE PERÍODO                                                   */
/* ================================================================== */

function DateRangeFilter({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onClear,
  hasFilter,
}: {
  startDate: string;
  endDate: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onClear: () => void;
  hasFilter: boolean;
}) {
  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    onStartChange(start.toISOString().slice(0, 10));
    onEndChange(end.toISOString().slice(0, 10));
  };

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border bg-gradient-to-r from-chocolate to-chocolate-dark px-5 py-3">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
          <CalendarDays className="h-4 w-4" />
          Filtrar por período
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3 px-5 py-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Data inicial
          </label>
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => onStartChange(e.target.value)}
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
          />
        </div>
        <div className="pb-3 text-muted-foreground">
          <span className="text-lg">–</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Data final
          </label>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => onEndChange(e.target.value)}
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
          />
        </div>

        <div className="flex items-center gap-1.5 pb-1">
          <span className="hidden text-xs text-muted-foreground sm:inline">Atalhos:</span>
          <button
            onClick={() => applyPreset(1)}
            className="rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-chocolate-dark transition-colors hover:bg-gold-soft"
          >
            Hoje
          </button>
          <button
            onClick={() => applyPreset(7)}
            className="rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-chocolate-dark transition-colors hover:bg-gold-soft"
          >
            7 dias
          </button>
          <button
            onClick={() => applyPreset(30)}
            className="rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-chocolate-dark transition-colors hover:bg-gold-soft"
          >
            30 dias
          </button>
        </div>

        {hasFilter && (
          <button
            onClick={onClear}
            className="ml-auto flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-gold hover:text-chocolate-dark"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* DASHBOARD                                                           */
/* ================================================================== */

function DashboardTab({
  orders,
  periodStart,
  periodEnd,
}: {
  orders: Order[];
  periodStart: string;
  periodEnd: string;
}) {
  const periodLabel = useMemo(() => {
    if (!periodStart && !periodEnd) return "Todos os períodos";
    const fmt = (d: string) =>
      d
        ? new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "";
    if (periodStart && periodEnd) return `${fmt(periodStart)} — ${fmt(periodEnd)}`;
    if (periodStart) return `a partir de ${fmt(periodStart)}`;
    return `até ${fmt(periodEnd)}`;
  }, [periodStart, periodEnd]);

  const kpis = useMemo(() => {
    const confirmed = orders.filter(
      (o) => o.status !== "cancelado" && o.paymentStatus !== "cancelado",
    );
    const totalReceita = confirmed.reduce((acc, o) => acc + o.total, 0);
    const totalPedidos = confirmed.length;
    const ticketMedio = totalPedidos > 0 ? totalReceita / totalPedidos : 0;
    const aReceber = orders
      .filter((o) => o.paymentStatus === "pendente" && o.status !== "cancelado")
      .reduce((acc, o) => acc + o.total, 0);

    return { totalReceita, totalPedidos, ticketMedio, aReceber };
  }, [orders]);

  const monthlyData = useMemo(() => {
    const map = new Map<
      string,
      { receita: number; pedidos: number; label: string; monthLabel: string }
    >();
    const confirmed = orders.filter(
      (o) => o.status !== "cancelado" && o.paymentStatus !== "cancelado",
    );

    for (const o of confirmed) {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      const existing = map.get(key) ?? { receita: 0, pedidos: 0, label: key, monthLabel: label };
      existing.receita += o.total;
      existing.pedidos += 1;
      map.set(key, existing);
    }

    return Array.from(map.values())
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(-6);
  }, [orders]);

  const paymentStatusData = useMemo(() => {
    const counts = { pendente: 0, aprovado: 0, recusado: 0, cancelado: 0 };
    for (const o of orders) {
      counts[o.paymentStatus as keyof typeof counts] += 1;
    }
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [orders]);

  const methodData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) {
      counts[o.paymentMethod] = (counts[o.paymentMethod] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 8), [orders]);

  return (
    <div className="mt-4 space-y-6">
      {periodLabel !== "Todos os períodos" && (
        <div className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold-soft/40 px-4 py-2.5 text-xs font-medium text-chocolate-dark">
          <CalendarDays className="h-4 w-4 text-gold-dark" />
          Exibindo dados do período: <span className="font-bold">{periodLabel}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Receita Total"
          value={formatCurrency(kpis.totalReceita)}
          color="text-chocolate"
          bg="bg-chocolate/10"
        />
        <KpiCard
          icon={<Package className="h-5 w-5" />}
          label="Pedidos Confirmados"
          value={String(kpis.totalPedidos)}
          color="text-blue-600"
          bg="bg-blue-500/10"
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Ticket Médio"
          value={formatCurrency(kpis.ticketMedio)}
          color="text-purple-600"
          bg="bg-purple-500/10"
        />
        <KpiCard
          icon={<Clock className="h-5 w-5" />}
          label="A Receber"
          value={formatCurrency(kpis.aReceber)}
          color="text-amber-600"
          bg="bg-amber-500/10"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Bar Chart - Receita Mensal */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-sm font-bold text-foreground">Receita Mensal</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Últimos 6 meses</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    if (!d) return null;
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
                        <p className="font-semibold text-foreground">{d.monthLabel}</p>
                        <p className="text-chocolate">{formatCurrency(d.receita)}</p>
                        <p className="text-muted-foreground">{d.pedidos} pedidos</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="receita" fill="#2a1510" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Charts */}
        <div className="space-y-6">
          {/* Status de Pagamento */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display text-sm font-bold text-foreground">
              Status dos Pagamentos
            </h3>
            <div className="mt-3 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    stroke="none"
                  >
                    {paymentStatusData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={PAYMENT_STATUS_COLORS[entry.name] ?? "#9ca3af"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      if (!d) return null;
                      return (
                        <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
                          <p className="font-semibold capitalize text-foreground">
                            {d.name === "pendente"
                              ? "Pendente"
                              : d.name === "aprovado"
                                ? "Aprovado"
                                : d.name === "recusado"
                                  ? "Recusado"
                                  : "Cancelado"}
                          </p>
                          <p className="text-muted-foreground">{d.value} pedidos</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {paymentStatusData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: PAYMENT_STATUS_COLORS[d.name] }}
                  />
                  <span className="capitalize text-muted-foreground">
                    {d.name === "pendente"
                      ? "Pendente"
                      : d.name === "aprovado"
                        ? "Aprovado"
                        : d.name === "recusado"
                          ? "Recusado"
                          : "Cancelado"}
                    :{" "}
                  </span>
                  <span className="font-medium text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Método de Pagamento */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display text-sm font-bold text-foreground">
              Por Método de Pagamento
            </h3>
            <div className="mt-3 space-y-2.5">
              {methodData.map((d) => {
                const total = methodData.reduce((a, b) => a + b.value, 0);
                const pct = total > 0 ? (d.value / total) * 100 : 0;
                return (
                  <div key={d.name}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{paymentLabel(d.name)}</span>
                      <span className="text-muted-foreground">
                        {d.value} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: METHOD_COLORS[d.name] ?? "#9ca3af",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Últimos Pedidos */}
      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-display text-sm font-bold text-foreground">Últimos Pedidos</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium text-foreground">#{o.id.slice(0, 8)}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(o.createdAt)}
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate text-foreground">
                    {o.customer.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {paymentLabel(o.paymentMethod)}
                  </TableCell>
                  <TableCell>
                    <PaymentBadge status={o.paymentStatus} />
                  </TableCell>
                  <TableCell className="text-right font-semibold text-chocolate-dark">
                    {formatCurrency(o.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* CONTAS A RECEBER                                                    */
/* ================================================================== */

function ContasReceberTab({
  orders,
  periodStart,
  periodEnd,
}: {
  orders: Order[];
  periodStart: string;
  periodEnd: string;
}) {
  const [filter, setFilter] = useState<
    "todos" | "pendente" | "aprovado" | "recusado" | "cancelado"
  >("todos");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const filtered = useMemo(() => {
    if (filter === "todos") return orders;
    return orders.filter((o) => o.paymentStatus === filter);
  }, [orders, filter]);

  const summary = useMemo(() => {
    const pendente = orders
      .filter((o) => o.paymentStatus === "pendente" && o.status !== "cancelado")
      .reduce((a, o) => a + o.total, 0);
    const aprovado = orders
      .filter((o) => o.paymentStatus === "aprovado")
      .reduce((a, o) => a + o.total, 0);
    const recusado = orders
      .filter((o) => o.paymentStatus === "recusado")
      .reduce((a, o) => a + o.total, 0);
    const cancelado = orders
      .filter((o) => o.paymentStatus === "cancelado")
      .reduce((a, o) => a + o.total, 0);
    return { pendente, aprovado, recusado, cancelado };
  }, [orders]);

  const handleMarkPaid = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      const res = await adminUpdateOrderPaymentStatus(orderId, "aprovado");
      if (!res.ok) {
        toast.error("Não foi possível atualizar o pagamento", {
          description: res.error ?? "Tente novamente.",
        });
        return;
      }
      toast.success("Pagamento confirmado!");
      await queryClient.refetchQueries({ queryKey: ["all-orders"] });
    } finally {
      setUpdatingId(null);
    }
  };

  const imprimirRelatorio = () => {
    const periodo =
      periodStart || periodEnd
        ? `${periodStart ? fmtShort(periodStart) : "início"} a ${periodEnd ? fmtShort(periodEnd) : "hoje"}`
        : "Todos os períodos";
    const fmtData = (iso: string) =>
      new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    const fmtHora = (iso: string) =>
      new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const paymentTxt = (s: string) =>
      s === "pendente"
        ? "Pendente"
        : s === "aprovado"
          ? "Aprovado"
          : s === "recusado"
            ? "Recusado"
            : "Cancelado";
    const paymentColor = (s: string) =>
      s === "pendente"
        ? "color:#d97706;font-weight:700"
        : s === "aprovado"
          ? "color:#16a34a;font-weight:700"
          : s === "recusado"
            ? "color:#dc2626;font-weight:700"
            : "color:#6b7280;font-weight:700";

    const rowsHtml = filtered
      .map(
        (o) => `<tr>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;font-weight:600">#${o.id.slice(0, 8)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:center">${fmtData(o.createdAt)} ${fmtHora(o.createdAt)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px">${o.customer.name}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:center">${paymentLabel(o.paymentMethod)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:center;${paymentColor(o.paymentStatus)}">${paymentTxt(o.paymentStatus)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:center;color:#2563eb;font-weight:700">${statusLabel[o.status] ?? o.status}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:right;font-weight:700">${formatCurrency(o.total)}</td>
        </tr>`,
      )
      .join("");

    const totalAll = filtered.reduce((a, o) => a + o.total, 0);
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Relatório de Contas a Receber – Passarelli Doces</title>
  <style>
    @media print {
      @page { size: landscape; margin: 12mm 10mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 16px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2a1510; padding-bottom: 10px; margin-bottom: 14px; }
    .header h1 { font-size: 18px; color: #2a1510; }
    .header h2 { font-size: 13px; color: #2a1510; font-weight: 600; }
    .header .meta { font-size: 11px; color: #666; text-align: right; line-height: 1.5; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
    .kpi { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
    .kpi .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi .value { font-size: 16px; font-weight: 800; margin-top: 2px; }
    .kpi .hint { font-size: 10px; color: #888; margin-top: 1px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #2a1510; color: #f5e6c8; padding: 7px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; text-align: left; }
    th:first-child { border-radius: 6px 0 0 0; }
    th:last-child { border-radius: 0 6px 0 0; }
    td { text-align: left; }
    tr:nth-child(even) { background: #fafaf8; }
    .footer { margin-top: 10px; border-top: 1px solid #e5e7eb; padding-top: 8px; display: flex; justify-content: space-between; font-size: 11px; color: #888; }
    .footer .total { font-weight: 800; color: #2a1510; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Passarelli Doces</h1>
      <h2>Relatório de Contas a Receber</h2>
    </div>
    <div class="meta">
      Período: <strong>${periodo}</strong><br/>
      Emitido em: <strong>${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</strong>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi">
      <div class="label">A receber</div>
      <div class="value" style="color:#d97706">${formatCurrency(summary.pendente)}</div>
      <div class="hint">${orders.filter((o) => o.paymentStatus === "pendente" && o.status !== "cancelado").length} pedido${orders.filter((o) => o.paymentStatus === "pendente" && o.status !== "cancelado").length !== 1 ? "s" : ""}</div>
    </div>
    <div class="kpi">
      <div class="label">Recebido</div>
      <div class="value" style="color:#16a34a">${formatCurrency(summary.aprovado)}</div>
      <div class="hint">${orders.filter((o) => o.paymentStatus === "aprovado").length} pedido${orders.filter((o) => o.paymentStatus === "aprovado").length !== 1 ? "s" : ""}</div>
    </div>
    <div class="kpi">
      <div class="label">Recusado</div>
      <div class="value" style="color:#dc2626">${formatCurrency(summary.recusado)}</div>
      <div class="hint">${orders.filter((o) => o.paymentStatus === "recusado").length} pedido${orders.filter((o) => o.paymentStatus === "recusado").length !== 1 ? "s" : ""}</div>
    </div>
    <div class="kpi">
      <div class="label">Cancelado</div>
      <div class="value" style="color:#6b7280">${formatCurrency(summary.cancelado)}</div>
      <div class="hint">${orders.filter((o) => o.paymentStatus === "cancelado").length} pedido${orders.filter((o) => o.paymentStatus === "cancelado").length !== 1 ? "s" : ""}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Pedido</th>
        <th style="text-align:center">Data</th>
        <th>Cliente</th>
        <th style="text-align:center">Método</th>
        <th style="text-align:center">Status Pgto</th>
        <th style="text-align:center">Status</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="footer">
    <span>${filtered.length} registro${filtered.length !== 1 ? "s" : ""}</span>
    <span class="total">Total: ${formatCurrency(totalAll)}</span>
  </div>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 400);
    } else {
      toast.error("Bloqueador de pop-ups impediu a impressão. Libere este site.");
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Resumo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<Clock className="h-5 w-5" />}
          label="A Receber"
          value={formatCurrency(summary.pendente)}
          count={
            orders.filter((o) => o.paymentStatus === "pendente" && o.status !== "cancelado").length
          }
          color="text-amber-600"
          bg="bg-amber-500/10"
        />
        <SummaryCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Recebido"
          value={formatCurrency(summary.aprovado)}
          count={orders.filter((o) => o.paymentStatus === "aprovado").length}
          color="text-green-600"
          bg="bg-green-500/10"
        />
        <SummaryCard
          icon={<XCircle className="h-5 w-5" />}
          label="Recusado"
          value={formatCurrency(summary.recusado)}
          count={orders.filter((o) => o.paymentStatus === "recusado").length}
          color="text-red-600"
          bg="bg-red-500/10"
        />
        <SummaryCard
          icon={<Banknote className="h-5 w-5" />}
          label="Cancelado"
          value={formatCurrency(summary.cancelado)}
          count={orders.filter((o) => o.paymentStatus === "cancelado").length}
          color="text-gray-500"
          bg="bg-gray-500/10"
        />
      </div>

      {/* Filtro + Tabela */}
      <div className="rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h3 className="font-display text-sm font-bold text-foreground">
            Contas a Receber ({filtered.length})
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={imprimirRelatorio}
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir relatório
            </Button>
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="h-8 w-40 rounded-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="recusado">Recusado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status Pgto</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    Nenhum pedido encontrado para este filtro.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium text-foreground">
                      #{o.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(o.createdAt)}
                    </TableCell>
                    <TableCell>
                      <p className="max-w-[140px] truncate text-foreground">{o.customer.name}</p>
                      <p className="max-w-[140px] truncate text-xs text-muted-foreground">
                        {o.customer.email}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {paymentLabel(o.paymentMethod)}
                    </TableCell>
                    <TableCell>
                      <PaymentBadge status={o.paymentStatus} />
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          o.status === "cancelado"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700",
                        )}
                      >
                        {statusLabel[o.status] ?? o.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-chocolate-dark">
                      {formatCurrency(o.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      {o.paymentStatus === "pendente" && o.status !== "cancelado" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full border-green-300 text-green-700 hover:bg-green-50"
                          disabled={updatingId === o.id}
                          onClick={() => void handleMarkPaid(o.id)}
                        >
                          {updatingId === o.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Confirmar pgto
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* COMPONENTES AUXILIARES                                              */
/* ================================================================== */

function KpiCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", bg, color)}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-display text-xl font-extrabold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  count,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  count: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", bg, color)}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-display text-xl font-extrabold text-foreground">{value}</p>
          <p className="text-[10px] text-muted-foreground">
            {count} pedido{count !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pendente: { label: "Pendente", className: "bg-amber-100 text-amber-700" },
    aprovado: { label: "Aprovado", className: "bg-green-100 text-green-700" },
    recusado: { label: "Recusado", className: "bg-red-100 text-red-700" },
    cancelado: { label: "Cancelado", className: "bg-gray-100 text-gray-600" },
  };
  const c = config[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold", c.className)}>
      {c.label}
    </span>
  );
}
