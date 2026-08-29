import { createFileRoute } from "@tanstack/react-router";
import { InfoPageShell } from "@/components/store/info-page-shell";

export const Route = createFileRoute("/_store/trocas-e-devolucoes")({
  component: ReturnsPage,
  head: () => ({
    meta: [{ title: "Trocas e Devoluções — Passarelli Doces" }],
  }),
});

function ReturnsPage() {
  return (
    <InfoPageShell
      eyebrow="Direitos do consumidor"
      title="Trocas e Devoluções"
      lead="Queremos que você receba seus doces perfeitos. Se algo não sair como o esperado, conte com a gente."
    >
      <Section title="1. Produtos com defeito ou avaria">
        Ao receber seu pedido, verifique a embalagem. Se algum item chegou danificado ou com avaria,
        registre em até 48 horas pelo nosso WhatsApp com foto do produto — faremos a reposição ou
        devolução sem custo.
      </Section>

      <Section title="2. Arrependimento">
        Conforme o Código de Defesa do Consumidor, você pode desistir da compra em até 7 dias
        corridos após o recebimento, para itens não personalizados e em embalagem lacrada.
      </Section>

      <Section title="3. Itens personalizados e sob encomenda">
        Produtos feitos sob encomenda (mesas doces, bolos personalizados, kits com tema) não são
        elegíveis para troca, salvo em casos de erro nosso na confecção ou entrega.
      </Section>

      <Section title="4. Como solicitar">
        Entre em contato pelos nossos canais oficiais informando o número do pedido e o motivo.
        Nossa equipe resolverá o quanto antes, geralmente em até 5 dias úteis.
      </Section>

      <Section title="5. Reembolso">
        O reembolso é feito pelo mesmo meio de pagamento utilizado na compra. Para PIX, a devolução
        costuma cair em até 2 dias úteis após a confirmação.
      </Section>
    </InfoPageShell>
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
