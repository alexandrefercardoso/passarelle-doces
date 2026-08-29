import { Link } from "@tanstack/react-router";
import { Clock, Facebook, Instagram, Mail, MapPin, MessageCircle } from "lucide-react";
import { DEFAULT_SETTINGS, SITE_NAME } from "@/lib/constants";
import { buildWhatsAppLink } from "@/lib/format";
import { Logo } from "./logo";

const linksInstitucionais = [
  { label: "Quem Somos", to: "/quem-somos" },
  { label: "Contato", to: "/contato" },
  { label: "Política de Privacidade", to: "/politica-de-privacidade" },
  { label: "Trocas e Devoluções", to: "/trocas-e-devolucoes" },
  { label: "Formas de Pagamento", to: "/formas-de-pagamento" },
];

const linksLoja = [
  { label: "Todos os Produtos", to: "/produtos" },
  { label: "Promoções", to: "/promocoes" },
  { label: "Minha Conta", to: "/conta" },
  { label: "Meus Pedidos", to: "/pedidos" },
  { label: "Favoritos", to: "/favoritos" },
];

export function StoreFooter() {
  return (
    <footer className="border-t border-border bg-chocolate-dark text-cream">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo size="lg" />
            <p className="mt-4 text-sm leading-relaxed text-cream/80">
              Doces artesanais feitos com carinho e ingredientes selecionados para transformar
              qualquer momento em uma celebração.
            </p>
            <div className="mt-5 flex items-center gap-2.5">
              <SocialLink href={buildWhatsAppLink(DEFAULT_SETTINGS.whatsapp)} label="WhatsApp">
                <MessageCircle className="h-4 w-4" />
              </SocialLink>
              <SocialLink href="https://instagram.com/passarellidoces" label="Instagram">
                <Instagram className="h-4 w-4" />
              </SocialLink>
              <SocialLink href="https://facebook.com/passarellidoces" label="Facebook">
                <Facebook className="h-4 w-4" />
              </SocialLink>
              <SocialLink href={`mailto:${DEFAULT_SETTINGS.email}`} label="E-mail">
                <Mail className="h-4 w-4" />
              </SocialLink>
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-widest text-gold">
              Institucional
            </h4>
            <ul className="mt-4 space-y-2.5">
              {linksInstitucionais.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to as never}
                    className="text-sm text-cream/85 transition-colors hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-widest text-gold">
              A Loja
            </h4>
            <ul className="mt-4 space-y-2.5">
              {linksLoja.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to as never}
                    className="text-sm text-cream/85 transition-colors hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-widest text-gold">
              Atendimento
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-cream/85">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                {DEFAULT_SETTINGS.address}
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                {DEFAULT_SETTINGS.hours}
              </li>
              <li className="flex items-start gap-2.5">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                <a
                  href={buildWhatsAppLink(DEFAULT_SETTINGS.whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-gold"
                >
                  {DEFAULT_SETTINGS.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-cream/10 pt-6 text-xs text-cream/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE_NAME}. Todos os direitos reservados.
          </p>
          <p>Feito com carinho e muito chocolate 🍫</p>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/20 text-cream/80 transition-all hover:border-gold hover:text-gold"
    >
      {children}
    </a>
  );
}
