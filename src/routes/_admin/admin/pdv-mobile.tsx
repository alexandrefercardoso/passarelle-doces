"use client";

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  MapPin,
  Minus,
  PackageSearch,
  Pencil,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Trash2,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAdminData } from "@/hooks/use-admin-data";
import { adminSaveCustomer, adminDeleteCustomer } from "@/lib/api";
import { printOrderReceipt } from "@/components/admin/print-report";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/store/product-image";
import type { Order, Customer, CustomerInfo, PaymentOption, Product } from "@/lib/types";
import { PAYMENT_METHODS } from "@/lib/constants";

export const Route = createFileRoute("/_admin/admin/pdv-mobile")({
  component: PdvMobilePage,
});

type PdvCartItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string;
  quantity: number;
  stock: number;
};

type CustomerForm = {
  name: string;
  phone: string;
  email: string;
  document: string;
  zipCode: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  notes: string;
};

const EMPTY_FORM: CustomerForm = {
  name: "",
  phone: "",
  email: "",
  document: "",
  zipCode: "",
  address: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  notes: "",
};

const PDV_PAYMENTS: PaymentOption[] = [
  ...PAYMENT_METHODS,
  { id: "dinheiro", name: "Dinheiro", description: "Pagamento na entrega", type: "imediato" },
];

type PdvStep = "products" | "customer" | "payment";

/* ================================================================== */

function PdvMobilePage() {
  const { products, categories, customers, refresh, loading: dataLoading } = useAdminData();

  const [items, setItems] = useState<PdvCartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState<PdvStep>("products");

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [paymentId, setPaymentId] = useState("pix");
  const [discount, setDiscount] = useState(0);
  const [closing, setClosing] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  const activeProducts = useMemo(() => products.filter((p) => p.isActive), [products]);

  const filteredProducts = useMemo(() => {
    let list = activeProducts;
    if (selectedCategory) {
      list = list.filter((p) => p.categoryId === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
      );
    }
    return list;
  }, [activeProducts, selectedCategory, searchQuery]);

  const addItem = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: Math.min(i.quantity + 1, i.stock > 0 ? i.stock : Infinity) }
            : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          imageUrl: product.imageUrl,
          quantity: 1,
          stock: product.stock,
        },
      ];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.min(qty, i.stock > 0 ? i.stock : Infinity) }
          : i,
      ),
    );
  };

  const subtotal = items.reduce((a, i) => a + i.price * i.quantity, 0);
  const discountValue = Math.min(discount, subtotal);
  const total = Math.max(0, subtotal - discountValue);

  const selectedPayment = PDV_PAYMENTS.find((p) => p.id === paymentId);
  const isOpenPayment = selectedPayment?.type === "aberto";

  const goToCustomer = () => {
    if (items.length === 0) {
      toast.error("Adicione produtos ao pedido primeiro.");
      return;
    }
    setStep("customer");
  };

  const goToPayment = () => {
    if (!selectedCustomer) {
      toast.error("Selecione ou cadastre um cliente.");
      return;
    }
    setStep("payment");
  };

  const handleCloseOrder = async () => {
    if (items.length === 0) {
      toast.error("Adicione itens ao pedido antes de fechar.");
      return;
    }
    if (!selectedCustomer) {
      toast.error("Selecione ou cadastre um cliente.");
      return;
    }

    setClosing(true);
    try {
      const now = new Date();
      const stamp = now.toISOString().slice(0, 10).replace(/-/g, "");
      const seq = Math.floor(1000 + Math.random() * 9000);

      const customerInfo: CustomerInfo = {
        name: selectedCustomer.name,
        email: selectedCustomer.email ?? "",
        phone: selectedCustomer.phone,
        document: selectedCustomer.document ?? "",
        zipCode: selectedCustomer.zipCode ?? "",
        address: selectedCustomer.address ?? "",
        number: selectedCustomer.number ?? "",
        complement: selectedCustomer.complement ?? "",
        neighborhood: selectedCustomer.neighborhood ?? "",
        city: selectedCustomer.city ?? "",
        state: selectedCustomer.state ?? "",
        notes: "Pedido via PDV Mobile",
      };

      const order: Order = {
        id: `PD-${stamp}-${seq}`,
        createdAt: now.toISOString(),
        status: isOpenPayment ? "aguardando_pagamento" : "confirmado",
        paymentMethod: paymentId,
        paymentStatus: isOpenPayment ? "pendente" : "aprovado",
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          unitPrice: i.price,
          quantity: i.quantity,
          imageUrl: i.imageUrl,
        })),
        subtotal,
        discount: discountValue,
        shipping: 0,
        total,
        customer: customerInfo,
        source: "pdv",
      };

      const { saveOrder } = await import("@/lib/api");
      await saveOrder(order);

      toast.success("Pedido finalizado!", {
        description: `#${order.id} — ${formatCurrency(total)}`,
      });

      let showPrint = false;
      try {
        const { fetchSiteSettings } = await import("@/lib/api");
        const siteSettings = await fetchSiteSettings();
        showPrint = siteSettings.showPdvPrintOption ?? false;
      } catch {
        showPrint = false;
      }

      setItems([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setPaymentId("pix");
      setStep("products");

      if (showPrint) {
        setPrintOrder(order);
        setShowPrintDialog(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar pedido";
      toast.error("Erro ao fechar pedido", { description: msg });
    } finally {
      setClosing(false);
    }
  };

  const handleSaveCustomer = async (form: CustomerForm) => {
    const id = editingCustomer?.id ?? `CUST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const res = await adminSaveCustomer({
      id,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      document: form.document.trim(),
      zipCode: form.zipCode.trim(),
      address: form.address.trim(),
      number: form.number.trim(),
      complement: form.complement.trim(),
      neighborhood: form.neighborhood.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      notes: form.notes.trim(),
    });
    if (!res.ok) {
      toast.error("Erro ao salvar cliente", { description: res.error });
      return;
    }
    await refresh();
    const list = await (await import("@/lib/api")).adminFetchCustomers();
    const saved = list.find((c) => c.id === id);
    if (saved) setSelectedCustomer(saved);
    toast.success(editingCustomer ? "Cliente atualizado!" : "Cliente cadastrado!");
    setShowCustomerDialog(false);
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    const res = await adminDeleteCustomer(customerId);
    if (!res.ok) {
      toast.error("Erro ao excluir cliente", { description: res.error });
      return;
    }
    if (selectedCustomer?.id === customerId) setSelectedCustomer(null);
    toast.success("Cliente removido.");
    await refresh();
  };

  if (dataLoading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-muted" />;
  }

  return (
    <div className="-mx-4 -mt-4 flex h-[calc(100vh-3.5rem)] flex-col bg-background sm:-mx-6 sm:-mt-6">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold-dark">
              Ponto de Venda
            </p>
            <h1 className="font-display text-lg font-extrabold tracking-tight text-foreground">
              PDV Mobile
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total
            </p>
            <p className="font-display text-lg font-extrabold text-chocolate-dark">
              {formatCurrency(total)}
            </p>
          </div>
        </div>

        {/* Barra de etapas */}
        <div className="mt-3 flex items-center gap-1.5">
          {(
            [
              { id: "products", label: "Produtos" },
              { id: "customer", label: "Cliente" },
              { id: "payment", label: "Pagamento" },
            ] as { id: PdvStep; label: string }[]
          ).map((s, idx) => {
            const done =
              (s.id === "products" && items.length > 0) ||
              (s.id === "customer" && !!selectedCustomer);
            const active = step === s.id;
            return (
              <div key={s.id} className="flex flex-1 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setStep(s.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-bold transition-colors",
                    active
                      ? "bg-chocolate text-cream"
                      : done
                        ? "bg-gold-soft/60 text-chocolate-dark"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {idx < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ============ ETAPA 1 — PRODUTOS ============ */}
      {step === "products" && (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* Categorias */}
            <div className="no-scrollbar sticky top-0 z-10 flex gap-1.5 overflow-x-auto border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
                  !selectedCategory
                    ? "bg-chocolate text-cream"
                    : "border border-border text-muted-foreground hover:text-foreground",
                )}
              >
                Todos
              </button>
              {categories
                .filter((c) => c.isActive)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
                      selectedCategory === cat.id
                        ? "bg-chocolate text-cream"
                        : "border border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
            </div>

            {/* Busca */}
            <div className="border-b border-border px-4 pb-3 pt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                />
              </div>
            </div>

            {/* Produtos */}
            <div className="p-3">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <PackageSearch className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    Nenhum produto encontrado
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tente buscar por outro nome ou selecione outra categoria.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addItem(product)}
                      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-gold hover:shadow-md active:scale-95"
                    >
                      <div className="relative">
                        <div className="h-16 w-full overflow-hidden bg-cream">
                          <ProductImage
                            src={product.imageUrl}
                            alt={product.name}
                            emoji="🧁"
                            className="transition-transform duration-300 group-hover:scale-110"
                            sizes="120px"
                          />
                        </div>
                        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-chocolate text-cream opacity-0 shadow transition-opacity group-hover:opacity-100">
                          <Plus className="h-3 w-3" />
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-1.5 text-left">
                        <p className="line-clamp-2 text-[10px] font-semibold text-foreground leading-tight">
                          {product.name}
                        </p>
                        <p className="mt-auto pt-0.5 text-xs font-bold text-chocolate-dark">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Barra flutuante do carrinho */}
          {items.length > 0 && (
            <div className="shrink-0 border-t border-border bg-card px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
              <Button
                className="h-12 w-full rounded-full text-base font-bold"
                onClick={goToCustomer}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Ver carrinho · {items.length} {items.length === 1 ? "item" : "itens"} ·{" "}
                {formatCurrency(total)}
                <ArrowRight className="ml-auto h-5 w-5" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* ============ ETAPA 2 — CLIENTE ============ */}
      {step === "customer" && (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* Cliente */}
            <div className="border-b border-border bg-card px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Cliente
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 rounded-full px-2.5 text-xs text-gold-dark hover:text-chocolate-dark"
                  onClick={() => {
                    setEditingCustomer(null);
                    setShowCustomerDialog(true);
                  }}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Novo
                </Button>
              </div>
              {selectedCustomer ? (
                <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-gold/40 bg-gold-soft/30 px-3 py-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-chocolate/10 font-display text-sm font-bold text-chocolate">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {selectedCustomer.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedCustomer.phone}
                      {selectedCustomer.document ? ` · ${selectedCustomer.document}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingCustomer(selectedCustomer);
                      setShowCustomerDialog(true);
                    }}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                    title="Remover"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <CustomerSearch
                  customers={customers}
                  onSelect={setSelectedCustomer}
                  onDelete={handleDeleteCustomer}
                />
              )}
            </div>

            {/* Itens do pedido */}
            <div className="px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Itens do pedido
                </p>
                <button
                  onClick={() => setStep("products")}
                  className="flex items-center gap-1 text-xs font-semibold text-gold-dark hover:text-chocolate-dark"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Adicionar mais
                </button>
              </div>
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <ShoppingCart className="h-7 w-7 text-muted-foreground/50" />
                  <p className="mt-2 text-sm font-medium text-foreground">Carrinho vazio</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li
                      key={item.productId}
                      className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5"
                    >
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-cream">
                        <ProductImage src={item.imageUrl} alt={item.name} emoji="🧁" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-xs font-semibold text-foreground">
                          {item.name}
                        </p>
                        <p className="text-xs font-bold text-chocolate-dark">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          onClick={() => updateQty(item.productId, item.quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-gold hover:text-foreground"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.productId, item.quantity + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-gold hover:text-foreground"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Barra inferior */}
          <div className="shrink-0 border-t border-border bg-card px-4 py-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-full px-4"
                onClick={() => setStep("products")}
              >
                Voltar
              </Button>
              <Button
                className="h-11 flex-1 rounded-full text-base font-bold"
                disabled={!selectedCustomer}
                onClick={goToPayment}
              >
                {selectedCustomer ? "Continuar para pagamento" : "Selecione o cliente"}
                <ArrowRight className="ml-auto h-5 w-5" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ============ ETAPA 3 — PAGAMENTO ============ */}
      {step === "payment" && (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* Resumo cliente */}
            <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-chocolate/10 font-display text-sm font-bold text-chocolate">
                {selectedCustomer?.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {selectedCustomer?.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">{selectedCustomer?.phone}</p>
              </div>
              <button
                onClick={() => setStep("customer")}
                className="flex items-center gap-1 text-xs font-semibold text-gold-dark hover:text-chocolate-dark"
              >
                <Pencil className="h-3 w-3" />
                Alterar
              </button>
            </div>

            {/* Forma de pagamento */}
            <div className="px-4 py-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Forma de pagamento
              </p>
              <div className="space-y-2">
                {PDV_PAYMENTS.map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentId(pm.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all",
                      paymentId === pm.id
                        ? "border-gold bg-gold-soft/30 ring-2 ring-gold/20"
                        : "border-border bg-card hover:border-gold/50",
                    )}
                  >
                    <CreditCard
                      className={cn(
                        "h-5 w-5 shrink-0",
                        paymentId === pm.id ? "text-gold-dark" : "text-muted-foreground",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          paymentId === pm.id ? "text-gold-dark" : "text-foreground",
                        )}
                      >
                        {pm.name}
                      </p>
                      {pm.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{pm.description}</p>
                      )}
                      {pm.discount && pm.discount > 0 && (
                        <p className="mt-0.5 text-xs font-semibold text-green-600">
                          {pm.discount}% de desconto
                        </p>
                      )}
                    </div>
                    {paymentId === pm.id && <Check className="h-5 w-5 shrink-0 text-gold-dark" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Desconto */}
            <div className="px-4 pb-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Desconto
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5">
                <span className="text-sm text-muted-foreground">R$</span>
                <input
                  type="number"
                  min={0}
                  value={discount || ""}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  placeholder="0,00"
                  className="w-full bg-transparent text-base font-semibold text-foreground outline-none"
                />
                {discountValue > 0 && (
                  <button
                    onClick={() => setDiscount(0)}
                    className="text-xs font-semibold text-destructive hover:underline"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Resumo final */}
            <div className="mx-4 mb-4 rounded-2xl border border-border bg-card p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Resumo
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountValue > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto</span>
                    <span>-{formatCurrency(discountValue)}</span>
                  </div>
                )}
                {isOpenPayment && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Status</span>
                    <span>Aguardando pagamento</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
                  <span>Total</span>
                  <span className="font-display text-chocolate-dark">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Barra inferior */}
          <div className="shrink-0 border-t border-border bg-card px-4 py-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-full px-4"
                onClick={() => setStep("customer")}
              >
                Voltar
              </Button>
              <Button
                className="h-12 flex-1 rounded-full text-base font-bold"
                disabled={closing}
                onClick={() => void handleCloseOrder()}
              >
                {closing ? (
                  "Finalizando..."
                ) : (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Fechar Pedido — {formatCurrency(total)}
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Dialogs */}
      <CustomerDialog
        open={showCustomerDialog}
        onOpenChange={setShowCustomerDialog}
        editingCustomer={editingCustomer}
        onSave={handleSaveCustomer}
      />

      <PrintOrderDialog
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
        order={printOrder}
      />
    </div>
  );
}

/* ================================================================== */
/* BUSCA DE CLIENTE                                                    */
/* ================================================================== */

function CustomerSearch({
  customers,
  onSelect,
  onDelete,
}: {
  customers: Customer[];
  onSelect: (c: Customer) => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.document.includes(q),
    );
  }, [query, customers]);

  return (
    <div className="relative mt-2">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        placeholder="Buscar por nome, telefone, CPF/CNPJ..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
        className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
      />
      {showResults && query.trim() && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
          {results.length > 0 ? (
            results.map((c) => (
              <div
                key={c.id}
                className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2.5 last:border-0 hover:bg-muted"
                onClick={() => {
                  onSelect(c);
                  setQuery("");
                  setShowResults(false);
                }}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-chocolate/10 text-xs font-bold text-chocolate">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.phone}
                    {c.document ? ` · ${c.document}` : ""}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c.id);
                  }}
                  className="rounded-full p-1 text-muted-foreground hover:text-destructive"
                  title="Remover cliente"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          ) : (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              Nenhum cliente encontrado
            </div>
          )}
        </div>
      )}
      {showResults && <div className="fixed inset-0 z-40" onClick={() => setShowResults(false)} />}
    </div>
  );
}

/* ================================================================== */
/* DIALOG CADASTRO/EDIÇÃO CLIENTE                                      */
/* ================================================================== */

function CustomerDialog({
  open,
  onOpenChange,
  editingCustomer,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingCustomer: Customer | null;
  onSave: (form: CustomerForm) => void;
}) {
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  if (open && editingCustomer) {
    const f = editingCustomer;
    if (form.name !== f.name || form.phone !== f.phone) {
      setForm({
        name: f.name,
        phone: f.phone,
        email: f.email ?? "",
        document: f.document ?? "",
        zipCode: f.zipCode ?? "",
        address: f.address ?? "",
        number: f.number ?? "",
        complement: f.complement ?? "",
        neighborhood: f.neighborhood ?? "",
        city: f.city ?? "",
        state: f.state ?? "",
        notes: f.notes ?? "",
      });
    }
  }

  const setField = (field: keyof CustomerForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      setForm(EMPTY_FORM);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setForm(EMPTY_FORM);
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center transition-colors sm:items-center sm:p-4",
        open ? "visible bg-black/50" : "invisible",
      )}
      onClick={handleClose}
    >
      <div
        className={cn(
          "max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-2xl transition-transform sm:max-w-lg sm:rounded-3xl sm:p-6",
          open
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-full opacity-0 sm:translate-y-0 sm:scale-95",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chocolate/10">
              <User className="h-5 w-5 text-chocolate" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                {editingCustomer ? "Editar Cliente" : "Novo Cliente"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {editingCustomer
                  ? "Atualize os dados do cliente."
                  : "Preencha os dados para cadastrar."}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          {/* Dados pessoais */}
          <div className="rounded-xl border border-border bg-background/50 p-3.5">
            <h3 className="mb-2.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-chocolate">
              <User className="h-3 w-3" />
              Dados Pessoais
            </h3>
            <div className="space-y-2.5">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Nome completo"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    CPF/CNPJ
                  </label>
                  <input
                    type="text"
                    value={form.document}
                    onChange={(e) => setField("document", e.target.value)}
                    placeholder="000.000.000-00"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  E-mail
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="email@exemplo.com"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="rounded-xl border border-border bg-background/50 p-3.5">
            <h3 className="mb-2.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-chocolate">
              <MapPin className="h-3 w-3" />
              Endereço
            </h3>
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={form.zipCode}
                    onChange={(e) => setField("zipCode", e.target.value)}
                    placeholder="00000-000"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Rua
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                    placeholder="Rua, Avenida..."
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Nº
                  </label>
                  <input
                    type="text"
                    value={form.number}
                    onChange={(e) => setField("number", e.target.value)}
                    placeholder="Nº"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Compl.
                  </label>
                  <input
                    type="text"
                    value={form.complement}
                    onChange={(e) => setField("complement", e.target.value)}
                    placeholder="Apto, Bl."
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={form.neighborhood}
                    onChange={(e) => setField("neighborhood", e.target.value)}
                    placeholder="Bairro"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-[2fr_1fr] gap-2.5">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                    placeholder="Cidade"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    UF
                  </label>
                  <select
                    value={form.state}
                    onChange={(e) => setField("state", e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                  >
                    <option value="">UF</option>
                    {[
                      "AC",
                      "AL",
                      "AP",
                      "AM",
                      "BA",
                      "CE",
                      "DF",
                      "ES",
                      "GO",
                      "MA",
                      "MT",
                      "MS",
                      "MG",
                      "PA",
                      "PB",
                      "PR",
                      "PE",
                      "PI",
                      "RJ",
                      "RN",
                      "RS",
                      "RO",
                      "RR",
                      "SC",
                      "SP",
                      "SE",
                      "TO",
                    ].map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-full"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-full bg-chocolate text-white hover:bg-chocolate/90"
              disabled={!form.name.trim() || saving}
            >
              {saving ? "Salvando..." : editingCustomer ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================================================================== */
/* DIALOG IMPRIMIR CUPOM                                               */
/* ================================================================== */

function PrintOrderDialog({
  open,
  onOpenChange,
  order,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  order: Order | null;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors",
        open ? "visible bg-black/50" : "invisible",
      )}
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn(
          "w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl transition-transform",
          open ? "scale-100 opacity-100" : "scale-95 opacity-0",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-chocolate/10">
            <Printer className="h-7 w-7 text-chocolate" />
          </div>
          <h2 className="mt-3 font-display text-lg font-bold text-foreground">Imprimir cupom?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            O pedido <span className="font-semibold text-foreground">{order?.id}</span> foi
            finalizado com sucesso.
          </p>
          {order && (
            <p className="mt-2 font-display text-xl font-extrabold text-chocolate-dark">
              {formatCurrency(order.total)}
            </p>
          )}
        </div>

        <div className="mt-6 grid gap-2">
          <Button
            className="h-12 w-full rounded-full text-base font-bold"
            onClick={() => {
              if (order) printOrderReceipt(order);
              onOpenChange(false);
            }}
          >
            <Printer className="mr-2 h-5 w-5" />
            Imprimir cupom
          </Button>
          <Button
            variant="outline"
            className="h-11 w-full rounded-full"
            onClick={() => onOpenChange(false)}
          >
            Agora não
          </Button>
        </div>
      </div>
    </div>
  );
}
