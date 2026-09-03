import { createFileRoute } from "@tanstack/react-router";
import { Banknote, BookOpen, CreditCard, FileText, HandCoins, Landmark, ReceiptText, ShieldCheck } from "lucide-react";
import { InfoPageShell } from "@/components/store/info-page-shell";
import { useSiteSettings } from "@/hooks/use-store-data";
import type { PaymentOption } from "@/lib/types";

export const Route = createFileRoute("/_store/formas-de-pagamento")({
  component: PaymentsPage,
  head: () => ({
    meta: [{ title: "Formas de Pagamento — Passarelli Doces" }],
  }),
});

function PaymentIcon({ id }: { id: string }) {
  const map: Record<string, React.ReactNode> = {
    pix: <Banknote className="h-6 w-6" />,
    cartao: <CreditCard className="h-6 w-6" />,
    cartao_debito: <CreditCard className="h-6 w-6" />,
    boleto: <FileText className="h-6 w-6" />,
    dinheiro: <HandCoins className="h-6 w-6" />,
    cheque: <Landmark className="h-6 w-6" />,
    caderneta: <BookOpen className="h-6 w-6" />,
  };
  return map[id] ?? <ReceiptText className="h-6 w-6" />;
}

function PaymentsPage() {
  const { data: settings } = useSiteSettings();
  const methods: PaymentOption[] = settings?.paymentMethods ?? [];

  return (
    <InfoPageShell
      eyebrow="Facilidade na hora de pagar"
      title="Formas de Pagamento"
      lead="Escolha o jeito que for melhor para você. Trabalhamos com as formas de pagamento que aceitamos na loja."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {methods.map((m) => (
          <MethodCard key={m.id} icon={<PaymentIcon id={m.id} />} title={m.name} text={m.description} />
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-cream p-5">
        <p className="flex items-center gap-2 font-semibold text-chocolate-dark">
          <ShieldCheck className="h-5 w-5 text-gold-dark" />
          Ambiente seguro
        </p>
        <p className="mt-1">
          Todas as transações são processadas por ambientes criptografados e seguros. Nunca
          armazenamos dados de cartão em nossos servidores.
        </p>
      </div>

      <Section title="Pedidos em aberto">
        Para pagamentos como boleto, cheque, dinheiro na entrega ou caderneta, o pedido fica{" "}
        <strong>em aberto</strong> até o recebimento, e pode ser combinado diretamente com a nossa
        loja.
      </Section>
    </InfoPageShell>
  );
}

function MethodCard({ icon, title, text }: { icon: React.ReactNode; title: string; text?: string | undefined }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold-soft text-gold-dark">
        {icon}
      </div>
      <p className="mt-3 font-display text-base font-bold text-foreground">{title}</p>
      {text && <p className="mt-1 text-xs text-muted-foreground">{text}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
      <p className="mt-2">{children}</p>
    </section>
  );
}
