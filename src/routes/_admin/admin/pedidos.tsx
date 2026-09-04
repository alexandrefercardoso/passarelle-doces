"use client";

import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar, Package, Printer, ReceiptText, Store, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { printReport, printOrderReceipt } from "@/components/admin/print-report";
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
import { EmptyState } from "@/components/store/empty-state";
import { OrderDetailDialog } from "@/components/admin/order-detail-dialog";
import {
  statusColorClass,
  statusLabel,
  paymentLabel,
  statusPaymentLabel,
} from "@/components/store/order-status";
import { useAllOrders } from "@/hooks/use-store-data";
import { adminDeleteOrder } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/admin/pedidos")({
  component: AdminOrdersPage,
});

type TabFilter = "todos" | "pdv" | "site";

type DatePreset = "hoje" | "7d" | "30d" | "ano" | "todos";

const TABS: {
  value: TabFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "todos", label: "Todos", icon: ReceiptText },
  { value: "pdv", label: "PDV", icon: Store },
  { value: "site", label: "Site", icon: Package },
];

const statusOptions = [
  { value: "aguardando_pagamento", label: "Aguardando pagamento" },
  { value: "confirmado", label: "Pagamento confirmado" },
  { value: "preparando", label: "Em preparo" },
  { value: "enviado", label: "Enviado" },
  { value: "entregue", label: "Entregue" },
  { value: "cancelado", label: "Cancelado" },
];

function AdminOrdersPage() {
  const { data, isLoading, refetch } = useAllOrders();
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("todos");

  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    const toStr = (d: Date) => d.toISOString().slice(0, 10);
    switch (preset) {
      case "hoje":
        setDateFrom(toStr(today));
        setDateTo(toStr(today));
        break;
      case "7d": {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        setDateFrom(toStr(d));
        setDateTo(toStr(today));
        break;
      }
      case "30d": {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        setDateFrom(toStr(d));
        setDateTo(toStr(today));
        break;
      }
      case "ano": {
        const d = new Date(today.getFullYear(), 0, 1);
        setDateFrom(toStr(d));
        setDateTo(toStr(today));
        break;
      }
      case "todos":
        setDateFrom("");
        setDateTo("");
        break;
    }
  };

  const clearDates = () => {
    setDateFrom("");
    setDateTo("");
    setDatePreset("todos");
  };

  const allOrders = useMemo(() => data ?? [], [data]);

  const orders = useMemo(() => {
    let list = allOrders;
    if (activeTab !== "todos") {
      list = list.filter((o) => o.source === activeTab);
    }
    if (dateFrom) {
      list = list.filter((o) => o.createdAt.slice(0, 10) >= dateFrom);
    }
    if (dateTo) {
      list = list.filter((o) => o.createdAt.slice(0, 10) <= dateTo);
    }
    return list;
  }, [allOrders, activeTab, dateFrom, dateTo]);

  const counts = useMemo(() => {
    let pdvAll = allOrders;
    let siteAll = allOrders;
    if (dateFrom) {
      pdvAll = pdvAll.filter((o) => o.createdAt.slice(0, 10) >= dateFrom);
      siteAll = siteAll.filter((o) => o.createdAt.slice(0, 10) >= dateFrom);
    }
    if (dateTo) {
      pdvAll = pdvAll.filter((o) => o.createdAt.slice(0, 10) <= dateTo);
      siteAll = siteAll.filter((o) => o.createdAt.slice(0, 10) <= dateTo);
    }
    const pdv = pdvAll.filter((o) => o.source === "pdv").length;
    const site = siteAll.filter((o) => o.source === "site").length;
    return { todos: pdv + site, pdv, site };
  }, [allOrders, dateFrom, dateTo]);

  const openPdvOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setDialogOpen(true);
  };

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) {
        toast.error("Não foi possível atualizar o status");
      } else {
        toast.success("Status atualizado com sucesso");
      }
      void refetch();
    } finally {
      setUpdating(null);
    }
  };

  const printA4 = () => {
    const label = activeTab === "pdv" ? "PDV" : activeTab === "site" ? "Site" : "Todos";
    const periodo =
      dateFrom || dateTo
        ? `${dateFrom ? dateFrom.split("-").reverse().join("/") : " início"} a ${dateTo ? dateTo.split("-").reverse().join("/") : "hoje"}`
        : "Todos os pedidos";
    printReport({
      title: `Relatório de Pedidos — ${label}`,
      subtitle: periodo,
      orders,
      format: "a4",
    });
  };

  const printCupom = () => {
    const label = activeTab === "pdv" ? "PDV" : activeTab === "site" ? "Site" : "Todos";
    const periodo =
      dateFrom || dateTo
        ? `${dateFrom ? dateFrom.split("-").reverse().join("/") : " início"} a ${dateTo ? dateTo.split("-").reverse().join("/") : "hoje"}`
        : "Todos os pedidos";
    printReport({
      title: `Pedidos — ${label}`,
      subtitle: periodo,
      orders,
      format: "cupom",
    });
  };

  const deleteOrder = async (orderId: string) => {
    const res = await adminDeleteOrder(orderId);
    if (!res.ok) {
      toast.error("Não foi possível excluir o pedido", {
        description: res.error ?? "Tente novamente.",
      });
      return;
    }
    toast.success("Pedido excluído com sucesso");
    void queryClient.invalidateQueries({ queryKey: ["all-orders"] });
    void refetch();
  };

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-muted" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Pedidos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {allOrders.length} pedidos registrados.
          {activeTab !== "todos" &&
            ` Mostrando ${orders.length} ${activeTab === "pdv" ? "do PDV" : "da loja"}.`}
        </p>
      </div>

      {/* Abas de filtro */}
      <div className="flex gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count = counts[tab.value];
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                isActive
                  ? tab.value === "pdv"
                    ? "bg-chocolate text-cream"
                    : tab.value === "site"
                      ? "bg-blue-600 text-white"
                      : "bg-foreground text-background"
                  : "border border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span
                className={cn(
                  "ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                  isActive ? "bg-white/20 text-inherit" : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filtro de data */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Período:</span>
        </div>
        <div className="flex gap-1">
          {(
            [
              { value: "hoje", label: "Hoje" },
              { value: "7d", label: "7 dias" },
              { value: "30d", label: "30 dias" },
              { value: "ano", label: "Ano" },
              { value: "todos", label: "Todos" },
            ] as const
          ).map((p) => (
            <button
              key={p.value}
              onClick={() => applyPreset(p.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                datePreset === p.value
                  ? "bg-foreground text-background"
                  : "border border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setDatePreset("todos");
            }}
            className="h-8 rounded-full border border-border bg-card px-3 text-xs outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
          />
          <span className="text-xs text-muted-foreground">até</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setDatePreset("todos");
            }}
            className="h-8 rounded-full border border-border bg-card px-3 text-xs outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
          />
        </div>
        {(dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-full text-xs text-muted-foreground"
            onClick={clearDates}
          >
            <X className="mr-1 h-3 w-3" />
            Limpar
          </Button>
        )}
        <span className="text-xs text-muted-foreground">
          {orders.length} pedido{orders.length !== 1 ? "s" : ""}
        </span>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={printA4}
            disabled={orders.length === 0}
          >
            <Printer className="mr-2 h-4 w-4" />
            A4
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={printCupom}
            disabled={orders.length === 0}
          >
            <Printer className="mr-2 h-4 w-4" />
            Bobina
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {orders.length === 0 ? (
          <EmptyState
            icon={activeTab === "pdv" ? Store : activeTab === "site" ? Package : ReceiptText}
            title={
              activeTab === "todos"
                ? "Nenhum pedido"
                : activeTab === "pdv"
                  ? "Nenhum pedido do PDV"
                  : "Nenhum pedido da loja"
            }
            description={
              activeTab === "todos"
                ? "Os pedidos aparecerão aqui."
                : activeTab === "pdv"
                  ? "Pedidos feitos no PDV aparecerão aqui."
                  : "Pedidos feitos pela loja online aparecerão aqui."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden lg:table-cell">Itens</TableHead>
                  <TableHead className="hidden md:table-cell">Pagamento</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const isPdv = order.source === "pdv";
                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        {isPdv ? (
                          <button
                            onClick={() => openPdvOrder(order.id)}
                            className="font-semibold text-gold-dark hover:underline"
                          >
                            {order.id}
                          </button>
                        ) : (
                          <Link
                            to="/pedidos/$id"
                            params={{ id: order.id }}
                            className="font-semibold text-gold-dark hover:underline"
                            target="_blank"
                          >
                            {order.id}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                            isPdv ? "bg-chocolate/10 text-chocolate" : "bg-blue-50 text-blue-700",
                          )}
                        >
                          {isPdv ? (
                            <>
                              <Store className="h-2.5 w-2.5" /> PDV
                            </>
                          ) : (
                            <>
                              <Package className="h-2.5 w-2.5" /> Site
                            </>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[160px] truncate font-medium text-foreground">
                          {order.customer.name}
                        </p>
                        <p className="max-w-[160px] truncate text-xs text-muted-foreground">
                          {order.customer.city}
                          {order.customer.state ? `/${order.customer.state}` : ""}
                        </p>
                      </TableCell>
                      <TableCell className="hidden max-w-[180px] lg:table-cell">
                        <p className="truncate text-sm text-muted-foreground">
                          {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                        </p>
                      </TableCell>
                      <TableCell className="hidden text-xs md:table-cell">
                        <p className="font-medium text-foreground">
                          {paymentLabel(order.paymentMethod)}
                        </p>
                        <p className="text-muted-foreground">
                          {statusPaymentLabel(order.paymentStatus)}
                        </p>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-chocolate-dark">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>
                        <div className="flex w-44 items-center gap-2">
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusColorClass(order.status)}`}
                          >
                            {statusLabel[order.status] ?? order.status}
                          </span>
                          <Select
                            value={order.status}
                            onValueChange={(v) => void updateStatus(order.id, v)}
                            disabled={updating === order.id}
                          >
                            <SelectTrigger className="h-8 w-16 rounded-full text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Imprimir cupom"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => printOrderReceipt(order)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Excluir pedido"
                            className="text-destructive hover:text-destructive"
                            disabled={updating === order.id}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Excluir o pedido #${order.id.slice(0, 15)}? Esta ação não pode ser desfeita.`,
                                )
                              ) {
                                void deleteOrder(order.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Dialog de detalhe do pedido PDV */}
      <OrderDetailDialog open={dialogOpen} onOpenChange={setDialogOpen} orderId={selectedOrderId} />
    </div>
  );
}
