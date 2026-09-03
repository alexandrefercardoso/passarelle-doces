"use client";

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ReceiptText, Trash2 } from "lucide-react";
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
import { EmptyState } from "@/components/store/empty-state";
import {
  statusColorClass,
  statusLabel,
  paymentLabel,
  statusPaymentLabel,
} from "@/components/store/order-status";
import { useAllOrders } from "@/hooks/use-store-data";
import { adminDeleteOrder } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/pedidos")({
  component: AdminOrdersPage,
});

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

  const orders = data ?? [];

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
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
        Pedidos
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {orders.length} pedidos registrados. Atualize o status para acompanhar os clientes.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        {orders.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="Nenhum pedido"
            description="Os pedidos feitos na loja aparecerão aqui."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        to="/pedidos/$id"
                        params={{ id: order.id }}
                        className="font-semibold text-gold-dark hover:underline"
                        target="_blank"
                      >
                        {order.id}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <p className="max-w-[160px] truncate font-medium text-foreground">
                        {order.customer.name}
                      </p>
                      <p className="max-w-[160px] truncate text-xs text-muted-foreground">
                        {order.customer.city}/{order.customer.state}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <p className="truncate text-sm text-muted-foreground">
                        {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs">
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
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Excluir pedido"
                        className="text-destructive hover:text-destructive"
                        disabled={updating === order.id}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Excluir o pedido #${order.id.slice(0, 8)}? Esta ação não pode ser desfeita.`,
                            )
                          ) {
                            void deleteOrder(order.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
