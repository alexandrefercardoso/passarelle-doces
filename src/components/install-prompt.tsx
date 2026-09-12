import { useState } from "react";
import { useLocation } from "@tanstack/react-router";

import { usePwaInstall } from "@/hooks/use-pwa-install";
import { InstallStepsDialog } from "@/components/install-app-button";

export function InstallPrompt() {
  const location = useLocation();
  const pwa = usePwaInstall();
  const [showSteps, setShowSteps] = useState(false);

  const isPdv = location.pathname === "/pdv-mobile";
  const isIosGuide = pwa.isIos && !pwa.installed;

  if (pwa.installed || pwa.dismissed) return null;
  if (!isIosGuide && !pwa.canInstall) return null;

  const title = isPdv
    ? "Instalar PDV na tela inicial"
    : isIosGuide
      ? "Instale o app no seu iPhone/iPad"
      : "Instalar app";
  const description = isPdv
    ? "Rápido acesso do caixa com internet mais estável e abertura direto no PDV Mobile."
    : isIosGuide
      ? 'Toque em Compartilhar e escolha "Adicionar à Tela de Início" para instalar a Passarelli Doces.'
      : "Acesse a loja em tela cheia, direto da tela inicial do seu celular.";

  const handleInstall = async () => {
    if (pwa.canPrompt) {
      const ok = await pwa.install();
      if (!ok) setShowSteps(true);
    } else {
      setShowSteps(true);
    }
  };

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 w-full max-w-md rounded-2xl border border-gold/40 bg-chocolate p-4 shadow-2xl shadow-black/40">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-chocolate-dark ring-1 ring-gold/50">
              <span className="font-display text-xl font-black italic text-gold">P</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight text-cream">{title}</p>
              <p className="mt-0.5 text-xs leading-snug text-cream/70">{description}</p>
            </div>
            <button
              type="button"
              onClick={pwa.dismiss}
              aria-label="Fechar aviso de instalação"
              className="shrink-0 rounded-full p-1 text-cream/50 transition-colors hover:bg-chocolate-dark hover:text-cream"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            onClick={handleInstall}
            className="mt-3 w-full rounded-full bg-gradient-to-b from-gold-soft to-gold px-4 py-2.5 text-sm font-bold text-chocolate transition hover:brightness-105 active:scale-[0.99]"
          >
            {isPdv ? "Instalar PDV na tela inicial" : "Instalar app"}
          </button>
        </div>
      </div>
      <InstallStepsDialog open={showSteps} onOpenChange={setShowSteps} />
    </>
  );
}
