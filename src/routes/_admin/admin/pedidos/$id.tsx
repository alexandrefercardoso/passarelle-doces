"use client";

import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, Loader2, MapPin, Package, Store, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/store/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  statusColorClass,
  statusLabel,
  paymentLabel,
  statusPaymentLabel,
} from "@/components/store/order-status";
import { ProductImage } from "@/components/store/product-image";
import { useAllOrders } from "@/hooks/use-store-data";
import { adminDeleteOrder } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/admin/pedidos/$id")({
  component: AdminOrderDetailPage,
});

const statusOptions = [
  { value: "aguardando_pagamento", label: "Aguardando pagamento" },
  { value: "confirmado", label: "Pagamento confirmado" },
  { value: "preparando", label: "Em preparo" },
  { value: "enviado", label: "Enviado" },
  { value: "entregue", label: "Entregue" },
  { value: "cancelado", label: "Cancelado" },
];

const paymentStatusOptions = [
  { value: "pendente", label: "Pendente" },
  { value: "aprovado", label: "Aprovado" },
  { value: "recusado", label: "Recusado" },
  { value: "cancelado", label: "Cancelado" },
];

function AdminOrderDetailPage() {
  const { id } = Route.useParams();
  const { data, isLoading, refetch } = useAllOrders();
  const order = data?.find((o) => o.id === id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  const isPdv = order?.source === "pdv";

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await adminDeleteOrder(id);
      if (!res.ok) {
        toast.error("Não foi possível excluir o pedido", {
          description: res.error ?? "Tente novamente.",
        });
        return;
      }
      toast.success("Pedido excluído com sucesso");
      void queryClient.invalidateQueries({ queryKey: ["all-orders"] });
      void navigate({ to: "/admin/pedidos" });
    } finally {
      setDeleting(false);
    }
  };

  const updateStatus = async (status: string) => {
    setUpdatingStatus(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) {
        toast.error("Erro ao atualizar status");
      } else {
        toast.success("Status atualizado!");
        void refetch();
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const updatePaymentStatus = async (paymentStatus: string) => {
    setUpdatingPayment(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase
        .from("orders")
        .update({ payment_status: paymentStatus })
        .eq("id", id);
      if (error) {
        toast.error("Erro ao atualizar pagamento");
      } else {
        toast.success("Status de pagamento atualizado!");
        void refetch();
      }
    } finally {
      setUpdatingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!order) {
    return (
      <EmptyState
        icon={Package}
        title="Pedido não encontrado"
        description="Não localizamos um pedido com esse identificador."
        action={
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/admin/pedidos">Voltar aos pedidos</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/admin/pedidos"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-chocolate-dark"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar aos pedidos
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
                Pedido {order.id}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                  isPdv ? "bg-chocolate/10 text-chocolate" : "bg-blue-50 text-blue-700",
                )}
              >
                {isPdv ? (
                  <>
                    <Store className="h-3 w-3" /> PDV
                  </>
                ) : (
                  <>
                    <Package className="h-3 w-3" /> Site
                  </>
                )}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Realizado em {formatDateTime(order.createdAt)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={deleting}
            onClick={() => {
              if (
                window.confirm(
                  "Excluir este pedido e todos os seus itens? Esta ação não pode ser desfeita.",
                )
              ) {
                void handleDelete();
              }
            }}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Coluna principal */}
        <div className="space-y-6">
          {/* Itens */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-base font-bold text-foreground">Itens do pedido</h2>
            <ul className="mt-4 divide-y divide-border">
              {order.items.map((item) => (
                <li
                  key={`${item.productId}-${item.name}`}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream">
                    <ProductImage src={item.imageUrl} alt={item.name} emoji="🧁" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-chocolate-dark">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">{formatCurrency(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <dt>Desconto</dt>
                  <dd className="font-medium">-{formatCurrency(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Frete</dt>
                <dd className="font-medium">
                  {order.shipping === 0 ? "Grátis" : formatCurrency(order.shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="font-semibold text-foreground">Total</dt>
                <dd className="font-display text-xl font-extrabold text-chocolate-dark">
                  {formatCurrency(order.total)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Status do Pedido */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-base font-bold text-foreground">Gerenciar pedido</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Status do pedido
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusColorClass(order.status)}`}
                  >
                    {statusLabel[order.status] ?? order.status}
                  </span>
                  <Select
                    value={order.status}
                    onValueChange={(v) => void updateStatus(v)}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger className="h-9 flex-1 rounded-full text-xs">
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
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Status do pagamento
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
                      order.paymentStatus === "aprovado"
                        ? "bg-green-100 text-green-700"
                        : order.paymentStatus === "pendente"
                          ? "bg-amber-100 text-amber-700"
                          : order.paymentStatus === "recusado"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600",
                    )}
                  >
                    {statusPaymentLabel(order.paymentStatus)}
                  </span>
                  <Select
                    value={order.paymentStatus}
                    onValueChange={(v) => void updatePaymentStatus(v)}
                    disabled={updatingPayment}
                  >
                    <SelectTrigger className="h-9 flex-1 rounded-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentStatusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-5">
          {/* Cliente */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-chocolate">
              <User className="h-3.5 w-3.5" />
              Cliente
            </h3>
            <div className="mt-3 space-y-1.5">
              <p className="text-sm font-semibold text-foreground">{order.customer.name}</p>
              {order.customer.email && (
                <p className="text-sm text-muted-foreground">{order.customer.email}</p>
              )}
              {order.customer.phone && (
                <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
              )}
              {order.customer.document && (
                <p className="text-sm text-muted-foreground">CPF/CNPJ: {order.customer.document}</p>
              )}
            </div>
          </div>

          {/* Endereço */}
          {(order.customer.address || order.customer.city) && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-chocolate">
                <MapPin className="h-3.5 w-3.5" />
                Endereço
              </h3>
              <div className="mt-3 space-y-1">
                {order.customer.address && (
                  <p className="text-sm text-foreground">
                    {order.customer.address}
                    {order.customer.number ? `, ${order.customer.number}` : ""}
                    {order.customer.complement ? ` - ${order.customer.complement}` : ""}
                  </p>
                )}
                {order.customer.neighborhood && (
                  <p className="text-sm text-muted-foreground">{order.customer.neighborhood}</p>
                )}
                {(order.customer.city || order.customer.state) && (
                  <p className="text-sm text-muted-foreground">
                    {order.customer.city}
                    {order.customer.state ? `/${order.customer.state}` : ""}
                  </p>
                )}
                {order.customer.zipCode && (
                  <p className="text-sm text-muted-foreground">CEP: {order.customer.zipCode}</p>
                )}
              </div>
            </div>
          )}

          {/* Pagamento */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-chocolate">
              <CreditCard className="h-3.5 w-3.5" />
              Pagamento
            </h3>
            <div className="mt-3 space-y-1.5">
              <p className="text-sm font-semibold text-foreground">
                {paymentLabel(order.paymentMethod)}
              </p>
              <p className="text-sm text-muted-foreground">
                {statusPaymentLabel(order.paymentStatus)}
              </p>
            </div>
          </div>

          {/* Origem */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-chocolate">
              {isPdv ? <Store className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
              Origem
            </h3>
            <p className="mt-3 text-sm text-foreground">
              {isPdv
                ? "Pedido realizado no PDV (Ponto de Venda)"
                : "Pedido realizado pela loja online"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
