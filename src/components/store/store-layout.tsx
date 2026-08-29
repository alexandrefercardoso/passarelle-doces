"use client";

import { useState } from "react";
import { Link, Outlet } from "@tanstack/react-router";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { buildWhatsAppLink } from "@/lib/format";
import { CartDrawer } from "./cart-drawer";
import { CategoryNav } from "./category-nav";
import { Header } from "./header";
import { MobileMenu } from "./mobile-menu";
import { TopBar } from "./top-bar";
import { StoreFooter } from "./store-footer";

export function StoreLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <Header onOpenMenu={() => setMenuOpen(true)} />
      <CategoryNav />

      <main className="flex-1">
        <Outlet />
      </main>

      <StoreFooter />

      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />
      <CartDrawer />

      {/* Botão flutuante do WhatsApp */}
      <a
        href={buildWhatsAppLink(
          DEFAULT_SETTINGS.whatsapp,
          "Olá! Estava olhando o site da Passarelli Doces e gostaria de mais informações.",
        )}
        target="_blank"
        rel="noreferrer"
        aria-label="Falar com a Passarelli Doces no WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 transition-transform hover:scale-110"
      >
        <MessageCircle className="h-7 w-7" />
      </a>

      {/* Selo de pagamento seguro */}
      <div className="fixed bottom-5 left-5 z-40 hidden items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur md:flex">
        <ShieldCheck className="h-4 w-4 text-gold-dark" />
        Compra segura
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}
