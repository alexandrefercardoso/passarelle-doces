import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, MessageCircle } from "lucide-react";
import { InfoPageShell } from "@/components/store/info-page-shell";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { buildWhatsAppLink } from "@/lib/format";

export const Route = createFileRoute("/_store/contato")({
  component: ContactPage,
  head: () => ({
    meta: [{ title: "Contato — Passarelli Doces" }],
  }),
});

function ContactPage() {
  return (
    <InfoPageShell
      eyebrow="Fale com a gente"
      title="Contato"
      lead="Tem uma dúvida, quer uma encomenda especial ou uma mesa doce? Estamos à disposição para adoçar o seu dia."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href={buildWhatsAppLink(DEFAULT_SETTINGS.whatsapp)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-gold"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blush text-rose">
            <MessageCircle className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">WhatsApp</p>
            <p className="text-xs text-muted-foreground">{DEFAULT_SETTINGS.phone}</p>
          </div>
        </a>
        <a
          href={`mailto:${DEFAULT_SETTINGS.email}`}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-gold"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-soft text-gold-dark">
            <Mail className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">E-mail</p>
            <p className="text-xs text-muted-foreground">{DEFAULT_SETTINGS.email}</p>
          </div>
        </a>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-chocolate-dark">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Endereço</p>
            <p className="text-xs text-muted-foreground">{DEFAULT_SETTINGS.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-chocolate-dark">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Atendimento</p>
            <p className="text-xs text-muted-foreground">{DEFAULT_SETTINGS.hours}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-cream p-5">
        <p className="font-semibold text-chocolate-dark">Precisa de ajuda com um pedido?</p>
        <p className="mt-1">
          Informe o número do seu pedido no WhatsApp para agilizar o atendimento. Também respondemos
          dúvidas sobre encomendas, mesas doces e datas comemorativas.
        </p>
        <Link
          to="/pedidos"
          className="mt-3 inline-block text-sm font-semibold text-gold-dark hover:underline"
        >
          Acompanhar meus pedidos →
        </Link>
      </div>
    </InfoPageShell>
  );
}
