import { Link } from "@tanstack/react-router";
import { Clock, MessageCircle } from "lucide-react";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { buildWhatsAppLink } from "@/lib/format";

export function TopBar() {
  return (
    <div className="bg-chocolate-dark text-cream">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-4 text-xs sm:px-6">
        <p className="truncate text-[13px] text-cream">{DEFAULT_SETTINGS.promoMessage}</p>
        <div className="hidden items-center gap-5 md:flex">
          <span className="inline-flex items-center gap-1.5 text-cream/85">
            <Clock className="h-3.5 w-3.5 text-gold" aria-hidden />
            {DEFAULT_SETTINGS.hours}
          </span>
          <a
            href={buildWhatsAppLink(DEFAULT_SETTINGS.whatsapp)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-cream/85 transition-colors hover:text-gold"
          >
            <MessageCircle className="h-3.5 w-3.5 text-gold" aria-hidden />
            {DEFAULT_SETTINGS.phone}
          </a>
          <Link
            to="/contato"
            className="font-medium text-cream/85 transition-colors hover:text-gold"
          >
            Fale conosco
          </Link>
        </div>
      </div>
    </div>
  );
}
