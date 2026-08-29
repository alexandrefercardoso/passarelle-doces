import { createFileRoute } from "@tanstack/react-router";
import { InfoPageShell } from "@/components/store/info-page-shell";
import { Logo } from "@/components/store/logo";

export const Route = createFileRoute("/_store/quem-somos")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "Quem Somos — Passarelli Doces" },
      {
        name: "description",
        content:
          "Conheça a história da Passarelli Doces: doceria artesanal que transforma ingredientes selecionados em momentos inesquecíveis.",
      },
    ],
  }),
});

function AboutPage() {
  return (
    <InfoPageShell
      eyebrow="Nossa história"
      title="Quem Somos"
      lead="Na PASSARELLI DOCES, acreditamos que todo doce carrega um sentimento: carinho, celebração, amor."
    >
      <div className="flex justify-center py-2">
        <Logo size="lg" />
      </div>

      <p>
        Nossa jornada começou na cozinha da família, entre panelas de brigadeiro e o aroma de
        chocolate derretido. O que era uma receita de domingo virou vocação: transformar
        ingredientes de qualidade em doces que marcam momentos.
      </p>

      <p>
        Hoje, a Passarelli Doces atende pela internet, entregando brigadeiros gourmet, trufas,
        chocolates, bolos e kits de festa para quem quer surpreender alguém especial — ou para quem
        merece um doce simplesmente porque sim.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <ValueCard
          emoji="🤎"
          title="Qualidade"
          text="Ingredientes selecionados e produção artesanal em cada receita."
        />
        <ValueCard
          emoji="🧁"
          title="Carinho"
          text="Cada encomenda é preparada com atenção aos detalhes e ao cliente."
        />
        <ValueCard
          emoji="🎉"
          title="Celebração"
          text="Do aniversário ao café da tarde, doce é sinônimo de felicidade."
        />
      </div>

      <div className="rounded-2xl border border-border bg-cream p-5">
        <p className="font-semibold text-chocolate-dark">Nossa missão</p>
        <p className="mt-1">
          Levar até você doces especiais, preparados com receitas próprias e apresentação
          caprichada, para que cada mordida seja uma lembrança doce.
        </p>
      </div>
    </InfoPageShell>
  );
}

function ValueCard({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center">
      <div className="text-3xl">{emoji}</div>
      <p className="mt-2 font-display text-base font-bold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
