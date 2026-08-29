import { createFileRoute } from "@tanstack/react-router";
import { Banknote, CreditCard, ReceiptText, ShieldCheck } from "lucide-react";
import { InfoPageShell } from "@/components/store/info-page-shell";

export const Route = createFileRoute("/_store/formas-de-pagamento")({
  component: PaymentsPage,
  head: () => ({
    meta: [{ title: "Formas de Pagamento — Passarelli Doces" }],
  }),
});

function PaymentsPage() {
  return (
    <InfoPageShell
      eyebrow="Facilidade na hora de pagar"
      title="Formas de Pagamento"
      lead="Escolha o jeito que for melhor para você. Trabalhamos com as principais formas de pagamento do mercado."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <MethodCard
          icon={<Banknote className="h-6 w-6" />}
          title="PIX"
          text="Aprovação imediata, sem burocracia e com confirmação na hora."
        />
        <MethodCard
          icon={<CreditCard className="h-6 w-6" />}
          title="Cartão"
          text="Crédito em até 3x sem juros e débito automático."
        />
        <MethodCard
          icon={<ReceiptText className="h-6 w-6" />}
          title="Boleto"
          text="Compensação em até 3 dias úteis após a emissão."
        />
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

      <Section title="Parcelamento">
        Compras acima de R$ 100 podem ser parceladas em até 3x sem juros no cartão de crédito. O
        valor das parcelas é calculado automaticamente no checkout.
      </Section>

      <Section title="Desconto no PIX">
        Pedidos pagos via PIX têm prioridade na preparação e podem receber condições especiais em
        períodos promocionais.
      </Section>
    </InfoPageShell>
  );
}

function MethodCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold-soft text-gold-dark">
        {icon}
      </div>
      <p className="mt-3 font-display text-base font-bold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
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
