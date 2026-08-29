import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Banknote,
  CreditCard,
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
import { saveOrder } from "@/lib/api";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_METHODS } from "@/lib/constants";
import { formatCurrency, maskDocument, maskPhone, maskZipCode } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CustomerInfo, Order, OrderStatus, PaymentMethod, ShippingMethod } from "@/lib/types";

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
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerInfo>(loadCustomer);
  const [shipping, setShipping] = useState<ShippingMethod>(
    SHIPPING_METHODS[0] ?? {
      id: "retirada",
      name: "Retirada na loja",
      price: 0,
      estimate: "Pronto no mesmo dia",
    },
  );
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [step, setStep] = useState<Step>("dados");
  const [placing, setPlacing] = useState(false);

  const discount = useMemo(() => (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 0), [subtotal]);

  const total = subtotal + shipping.price;

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

  const shippingPrice = () => {
    if (subtotal >= FREE_SHIPPING_THRESHOLD && shipping.price > 0) return 0;
    return shipping.price;
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

      const order: Order = {
        id: orderId,
        createdAt: now.toISOString(),
        status: "aguardando_pagamento" as OrderStatus,
        paymentMethod: payment,
        paymentStatus: payment === "pix" ? "pendente" : "pendente",
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
                  {subtotal >= FREE_SHIPPING_THRESHOLD && "Frete grátis aplicado! 🎉"}
                </p>
                <div className="mt-3 grid gap-2">
                  {SHIPPING_METHODS.map((m) => {
                    const effective = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : m.price;
                    return (
                      <label
                        key={m.id}
                        className={cn(
                          "flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-colors",
                          shipping.id === m.id
                            ? "border-gold bg-gold-soft/50"
                            : "border-border hover:border-gold/50",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={shipping.id === m.id}
                            onChange={() => setShipping(m)}
                            className="accent-[var(--color-chocolate)]"
                          />
                          <div>
                            <p className="text-sm font-semibold text-foreground">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.estimate}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-chocolate-dark">
                          {effective === 0 ? "Grátis" : formatCurrency(effective)}
                        </span>
                      </label>
                    );
                  })}
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
                <PaymentOption
                  id="pix"
                  icon={<Banknote className="h-5 w-5" />}
                  title="PIX"
                  text="Aprovação imediata e desconto de 5%"
                  selected={payment === "pix"}
                  onChange={() => setPayment("pix")}
                  extra={
                    payment === "pix" && (
                      <div className="rounded-xl bg-cream p-4 text-sm text-muted-foreground">
                        Vou exibir o QR Code PIX após a confirmação do pedido para você finalizar o
                        pagamento. O pedido é salvo e confirmado por e-mail assim que enviado.
                      </div>
                    )
                  }
                />
                <PaymentOption
                  id="cartao"
                  icon={<CreditCard className="h-5 w-5" />}
                  title="Cartão de crédito"
                  text="Em até 3x sem juros"
                  selected={payment === "cartao"}
                  onChange={() => setPayment("cartao")}
                  extra={
                    payment === "cartao" && (
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
                          Os dados do cartão são usados apenas para aprovação da cobrança e não são
                          armazenados pela loja.
                        </p>
                      </div>
                    )
                  }
                />
                <PaymentOption
                  id="boleto"
                  icon={<ReceiptText className="h-5 w-5" />}
                  title="Boleto bancário"
                  text="Compensação em até 3 dias úteis"
                  selected={payment === "boleto"}
                  onChange={() => setPayment("boleto")}
                  extra={
                    payment === "boleto" && (
                      <div className="rounded-xl bg-cream p-4 text-sm text-muted-foreground">
                        Enviaremos o boleto para o seu e-mail após a confirmação do pedido.
                      </div>
                    )
                  }
                />
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
                {shippingPrice() === 0 ? (
                  <span className="font-semibold text-chocolate-dark">Grátis</span>
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
  text: string;
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
          <p className="text-xs text-muted-foreground">{text}</p>
        </div>
      </div>
      {selected && extra && <div className="mt-3">{extra}</div>}
    </label>
  );
}
