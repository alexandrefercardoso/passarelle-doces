import { createFileRoute } from "@tanstack/react-router";
import { InfoPageShell } from "@/components/store/info-page-shell";

export const Route = createFileRoute("/_store/politica-de-privacidade")({
  component: PrivacyPage,
  head: () => ({
    meta: [{ title: "Política de Privacidade — Passarelli Doces" }],
  }),
});

function PrivacyPage() {
  return (
    <InfoPageShell
      eyebrow="Transparência e confiança"
      title="Política de Privacidade"
      lead="A Passarelli Doces trata os seus dados com o mesmo cuidado que trata seus doces."
    >
      <Section title="1. Coleta de dados">
        Coletamos apenas as informações necessárias para realizar seu pedido e melhorar sua
        experiência: nome, e-mail, telefone, endereço de entrega e, quando aplicável, preferências
        de produtos.
      </Section>

      <Section title="2. Uso das informações">
        Seus dados são utilizados para processar pedidos, entregar encomendas, enviar atualizações
        de status e, com seu consentimento, comunicados promocionais. Nunca vendemos seus dados a
        terceiros.
      </Section>

      <Section title="3. Pagamentos">
        As transações financeiras são processadas de forma segura. Não armazenamos dados de cartão
        de crédito em nossos servidores.
      </Section>

      <Section title="4. Cookies e navegação">
        Utilizamos cookies para guardar o carrinho de compras, favoritos e preferências de
        navegação, tornando sua experiência mais agradável.
      </Section>

      <Section title="5. Segurança">
        Adotamos boas práticas de segurança para proteger suas informações, incluindo comunicação
        criptografada e acesso restrito aos dados.
      </Section>

      <Section title="6. Seus direitos">
        Você pode solicitar a qualquer momento a correção ou exclusão dos seus dados, entrando em
        contato pelos nossos canais oficiais de atendimento.
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
