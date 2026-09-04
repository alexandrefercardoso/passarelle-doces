import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Banknote,
  BookOpen,
  CheckCircle2,
  CreditCard,
  FileText,
  HandCoins,
  Landmark,
  Loader2,
  MapPin,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/store/empty-state";
import { ProductImage } from "@/components/store/product-image";
import { useCart } from "@/hooks/use-cart";
import { useSiteSettings } from "@/hooks/use-store-data";
import { saveOrder } from "@/lib/api";
import { formatCurrency, maskDocument, maskPhone, maskZipCode } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  CustomerInfo,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentOption,
  ShippingMethod,
} from "@/lib/types";

export const Route = createFileRoute("/_store/checkout")({
  component: CheckoutPage,
  head: () => ({
    meta: [{ title: "Checkout — Passarelli Doces" }],
  }),
});

type Step = "dados" | "entrega" | "pagamento";

const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: "dados", label: "Seus dados", icon: <UserRound className="h-4 w-4" /> },
  { id: "entrega", label: "Entrega", icon: <MapPin className="h-4 w-4" /> },
  { id: "pagamento", label: "Pagamento", icon: <CreditCard className="h-4 w-4" /> },
];

const CUSTOMER_KEY = "passarelli_customer";

const emptyCustomer: CustomerInfo = {
  name: "",
  email: "",
  phone: "",
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

function loadCustomer(): CustomerInfo {
  try {
    const raw = localStorage.getItem(CUSTOMER_KEY);
    return raw ? { ...emptyCustomer, ...(JSON.parse(raw) as CustomerInfo) } : emptyCustomer;
  } catch {
    return emptyCustomer;
  }
}

function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { data: settings } = useSiteSettings();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerInfo>(loadCustomer);
  const [shipping, setShipping] = useState<ShippingMethod | null>(null);
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [step, setStep] = useState<Step>("dados");
  const [placing, setPlacing] = useState(false);

  const shippingMethods = settings?.shippingMethods ?? [];
  const freeShippingThreshold = settings?.freeShippingThreshold ?? 199;
  const freeShippingEnabled = settings?.freeShippingEnabled ?? false;
  const paymentMethods = settings?.paymentMethods ?? [];

  useEffect(() => {
    if (shippingMethods.length > 0) {
      setShipping((prev) => prev ?? shippingMethods[0] ?? null);
    }
  }, [shippingMethods]);

  useEffect(() => {
    if (paymentMethods.length > 0) {
      setPayment((prev) => prev ?? paymentMethods[0]?.id ?? null);
    }
  }, [paymentMethods]);

  if (shipping && !shippingMethods.some((m) => m.id === shipping.id)) {
    setShipping(shippingMethods[0] ?? null);
  }

  const effectiveShippingPrice = () => {
    if (!shipping) return 0;
    if (freeShippingEnabled && subtotal >= freeShippingThreshold && shipping.price > 0) {
      return 0;
    }
    return shipping.price;
  };

  const shippingPrice = effectiveShippingPrice;

  const discount = useMemo(() => 0, [subtotal]);

  const total = subtotal + (shipping ? effectiveShippingPrice() : 0);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={ShoppingBag}
          title="Seu carrinho está vazio"
          description="Adicione doces ao carrinho para continuar o checkout."
          action={
            <Button asChild className="rounded-full">
              <Link to="/produtos">Ver produtos</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const updateField = (field: keyof CustomerInfo, value: string) => {
    setCustomer((c) => ({ ...c, [field]: value }));
  };

  const canContinue = () => {
    if (step === "dados") return customer.name && customer.email && customer.phone;
    if (step === "entrega") return true;
    return true;
  };

  const goNext = () => {
    if (!canContinue()) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    if (step === "dados") setStep("entrega");
    else if (step === "entrega") setStep("pagamento");
  };

  const goBack = () => {
    if (step === "entrega") setStep("dados");
    else if (step === "pagamento") setStep("entrega");
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      try {
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
      } catch {
        // ignora
      }

      const now = new Date();
      const stamp = now.toISOString().slice(0, 10).replace(/-/g, "");
      const seq = Math.floor(1000 + Math.random() * 9000);
      const orderId = `PD-${stamp}-${seq}`;

      if (!payment) throw new Error("Escolha uma forma de pagamento");
      const selectedPayment = paymentMethods.find((m) => m.id === payment);
      const opensInAberto = selectedPayment?.type === "aberto";

      const order: Order = {
        id: orderId,
        createdAt: now.toISOString(),
        status: opensInAberto
          ? ("aguardando_pagamento" as OrderStatus)
          : ("confirmado" as OrderStatus),
        paymentMethod: payment,
        paymentStatus: opensInAberto ? "pendente" : "aprovado",
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          unitPrice: i.price,
          quantity: i.quantity,
          imageUrl: i.imageUrl,
        })),
        subtotal,
        discount: 0,
        shipping: shippingPrice(),
        total: total,
        customer,
        source: "site",
      };

      const res = await saveOrder(order);
      if (!res.ok) throw new Error("Falha ao registrar pedido");
      clearCart();
      navigate({ to: "/pedido-confirmado", search: { orderId } });
    } catch (error) {
      toast.error("Não foi possível concluir o pedido", {
        description: "Tente novamente em instantes.",
      });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
        Finalizar Compra
      </h1>

      {/* Stepper */}
      <ol className="mt-6 flex items-center gap-2 sm:gap-4">
        {steps.map((s, i) => (
          <li key={s.id} className="flex flex-1 items-center gap-2 sm:gap-4">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold sm:px-4 sm:text-sm",
                step === s.id
                  ? "bg-chocolate text-cream shadow-sm"
                  : i === 0 || step === "entrega"
                    ? "bg-cream text-chocolate-dark"
                    : "bg-muted text-muted-foreground",
              )}
            >
              <span className="text-gold">{s.icon}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className="h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        {/* Formulários */}
        <div className="space-y-6">
          {step === "dados" && (
            <section className="rounded-3xl border border-border bg-card p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
                <UserRound className="h-5 w-5 text-gold-dark" /> Dados pessoais
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Nome completo *">
                  <input
                    value={customer.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Como devemos te chamar?"
                    required
                  />
                </Field>
                <Field label="E-mail *">
                  <input
                    type="email"
                    value={customer.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="voce@email.com"
                    required
                  />
                </Field>
                <Field label="WhatsApp *">
                  <input
                    value={customer.phone}
                    onChange={(e) => updateField("phone", maskPhone(e.target.value))}
                    placeholder="(11) 98765-4321"
                    required
                  />
                </Field>
                <Field label="CPF">
                  <input
                    value={customer.document}
                    onChange={(e) => updateField("document", maskDocument(e.target.value))}
                    placeholder="000.000.000-00"
                  />
                </Field>
              </div>
            </section>
          )}

          {step === "entrega" && (
            <section className="rounded-3xl border border-border bg-card p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
                <MapPin className="h-5 w-5 text-gold-dark" /> Endereço de entrega
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="CEP">
                  <input
                    value={customer.zipCode}
                    onChange={(e) => updateField("zipCode", maskZipCode(e.target.value))}
                    placeholder="00000-000"
                  />
                </Field>
                <Field label="Estado (UF)">
                  <input
                    value={customer.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    placeholder="SP"
                    maxLength={2}
                  />
                </Field>
                <Field label="Cidade">
                  <input
                    value={customer.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="São Paulo"
                  />
                </Field>
                <Field label="Bairro">
                  <input
                    value={customer.neighborhood}
                    onChange={(e) => updateField("neighborhood", e.target.value)}
                    placeholder="Centro"
                  />
                </Field>
                <Field label="Endereço">
                  <input
                    value={customer.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Rua..."
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Número">
                    <input
                      value={customer.number}
                      onChange={(e) => updateField("number", e.target.value)}
                      placeholder="123"
                    />
                  </Field>
                  <Field label="Complemento">
                    <input
                      value={customer.complement}
                      onChange={(e) => updateField("complement", e.target.value)}
                      placeholder="Apto"
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Observações (opcional)">
                    <textarea
                      value={customer.notes}
                      onChange={(e) => updateField("notes", e.target.value)}
                      placeholder="Alguma observação para o seu docinho?"
                      rows={2}
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-foreground">Forma de envio</h3>
                <p className="text-xs text-muted-foreground">
                  {freeShippingEnabled &&
                    subtotal >= freeShippingThreshold &&
                    "Frete grátis aplicado! 🎉"}
                </p>
                <div className="mt-3 grid gap-2">
                  {shippingMethods.length > 0 ? (
                    shippingMethods.map((m) => {
                      const effective =
                        freeShippingEnabled && subtotal >= freeShippingThreshold ? 0 : m.price;
                      return (
                        <label
                          key={m.id}
                          className={cn(
                            "flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-colors",
                            shipping?.id === m.id
                              ? "border-gold bg-gold-soft/50"
                              : "border-border hover:border-gold/50",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shipping"
                              checked={shipping?.id === m.id}
                              onChange={() => setShipping(m)}
                              className="accent-[var(--color-chocolate)]"
                            />
                            <div>
                              <p className="text-sm font-semibold text-foreground">{m.name}</p>
                              {m.estimate && (
                                <p className="text-xs text-muted-foreground">{m.estimate}</p>
                              )}
                              {m.description && (
                                <p className="text-xs text-muted-foreground">{m.description}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-chocolate-dark">
                            {effective === 0 ? "Grátis" : formatCurrency(effective)}
                          </span>
                        </label>
                      );
                    })
                  ) : (
                    <p className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
                      Nenhuma forma de envio disponível no momento. Entre em contato para combinar a
                      entrega.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {step === "pagamento" && (
            <section className="rounded-3xl border border-border bg-card p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
                <CreditCard className="h-5 w-5 text-gold-dark" /> Forma de pagamento
              </h2>
              <div className="mt-5 grid gap-2">
                {paymentMethods.length === 0 ? (
                  <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                    Entre em contato para combinar a forma de pagamento.
                  </p>
                ) : (
                  paymentMethods.map((m) => (
                    <PaymentOption
                      key={m.id}
                      id={m.id}
                      icon={<PaymentIcon id={m.id} />}
                      title={m.name}
                      text={m.description}
                      selected={payment === m.id}
                      onChange={() => setPayment(m.id)}
                      extra={renderPaymentExtra(m)}
                    />
                  ))
                )}
              </div>
            </section>
          )}

          <div className="flex items-center justify-between gap-3">
            {step !== "dados" ? (
              <Button variant="outline" className="rounded-full" onClick={goBack}>
                Voltar
              </Button>
            ) : (
              <Link
                to="/carrinho"
                className="text-sm font-medium text-muted-foreground hover:text-chocolate-dark"
              >
                ← Voltar ao carrinho
              </Link>
            )}
            {step !== "pagamento" ? (
              <Button className="rounded-full px-8" onClick={goNext}>
                Continuar
              </Button>
            ) : (
              <Button
                className="h-12 rounded-full px-8 text-base font-semibold"
                onClick={placeOrder}
                disabled={placing}
              >
                {placing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Confirmando...
                  </>
                ) : (
                  "Confirmar pedido"
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Resumo lateral */}
        <aside className="rounded-3xl border border-border bg-card p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-lg font-bold text-foreground">Seu pedido</h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream">
                  <ProductImage src={item.imageUrl} alt={item.name} emoji="🧁" />
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-chocolate px-1 text-[10px] font-bold text-cream">
                    {item.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.price)} × {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-semibold text-chocolate-dark">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{formatCurrency(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Frete</dt>
              <dd className="font-medium">
                {shipping && shipping.price === 0 ? (
                  <span className="font-semibold text-chocolate-dark">
                    {shipping.name.toLowerCase().includes("retirada")
                      ? "Retirada grátis"
                      : "Grátis"}
                  </span>
                ) : shippingPrice() === 0 ? (
                  <span className="font-semibold text-gold-dark">Frete grátis</span>
                ) : (
                  formatCurrency(shippingPrice())
                )}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <dt className="font-semibold text-foreground">Total</dt>
              <dd className="font-display text-2xl font-extrabold text-chocolate-dark">
                {formatCurrency(subtotal + shippingPrice())}
              </dd>
            </div>
            {payment === "pix" && subtotal > 0 && (
              <p className="text-xs font-medium text-gold-dark">
                Com PIX você ainda ganha mais doçura no bolso. 🍬
              </p>
            )}
          </dl>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-gold-dark" />
            Ambiente seguro e dados protegidos
          </p>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function PaymentIcon({ id }: { id: string }) {
  const iconByMethod: Record<string, React.ReactNode> = {
    pix: <Banknote className="h-5 w-5" />,
    cartao: <CreditCard className="h-5 w-5" />,
    cartao_debito: <CreditCard className="h-5 w-5" />,
    boleto: <FileText className="h-5 w-5" />,
    dinheiro: <HandCoins className="h-5 w-5" />,
    cheque: <Landmark className="h-5 w-5" />,
    caderneta: <BookOpen className="h-5 w-5" />,
  };
  return iconByMethod[id] ?? <ReceiptText className="h-5 w-5" />;
}

function renderPaymentExtra(m: PaymentOption): React.ReactElement | null {
  if (m.type === "aberto") {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-cream p-4 text-sm text-muted-foreground">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
        <span>
          Este pedido fica <strong className="text-chocolate-dark">em aberto</strong> até recebermos
          o pagamento ({m.name}). Você pode pagar na entrega ou de acordo com o combinado com a
          nossa loja.
        </span>
      </div>
    );
  }
  if (m.id === "cartao" || m.id === "cartao_debito") {
    return (
      <div className="grid gap-3 rounded-xl bg-cream p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Número do cartão">
            <input placeholder="0000 0000 0000 0000" />
          </Field>
        </div>
        <Field label="Validade">
          <input placeholder="MM/AA" />
        </Field>
        <Field label="CVV">
          <input placeholder="123" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Nome impresso no cartão">
            <input placeholder="Como está no cartão" />
          </Field>
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          Os dados do cartão (para métodos imediatos) serão processados externamente. Pedidos em
          aberto seguem para confirmação manual pela loja.
        </p>
      </div>
    );
  }
  return null;
}

function PaymentOption({
  id,
  icon,
  title,
  text,
  selected,
  onChange,
  extra,
}: {
  id: PaymentMethod;
  icon: React.ReactNode;
  title: string;
  text?: string | undefined;
  selected: boolean;
  onChange: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "block cursor-pointer rounded-2xl border p-4 transition-colors",
        selected ? "border-gold bg-gold-soft/50" : "border-border hover:border-gold/50",
      )}
    >
      <div className="flex items-center gap-3">
        <input
          type="radio"
          name="payment"
          checked={selected}
          onChange={onChange}
          className="accent-[var(--color-chocolate)]"
        />
        <span className={cn("text-gold-dark", selected && "text-chocolate-dark")}>{icon}</span>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {text && <p className="text-xs text-muted-foreground">{text}</p>}
        </div>
      </div>
      {selected && extra && <div className="mt-3">{extra}</div>}
    </label>
  );
}
